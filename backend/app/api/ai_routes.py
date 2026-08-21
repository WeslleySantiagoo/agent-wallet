import json
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.db.database import getDb
from app.db.models import ChatSession, ChatMessage, AIUsage
from app.schemas.schemas import ChatSessionResponse, ChatMessageResponse, AIUsageSummary, AIUsageModelDetails
from app.ai_agent.strategy import AgentResponse
from app.ai_agent import provider_config

router = APIRouter(prefix="/ai", tags=["AI Agent & Chat History"])

class ChatRequest(BaseModel):
    message: str
    provider_id: Optional[str] = None
    model_id: Optional[str] = None
    session_id: Optional[int] = None

def parseMessageFields(msg: ChatMessage) -> ChatMessageResponse:
    actions = json.loads(msg.actions_executed) if msg.actions_executed else []
    charts = json.loads(msg.charts) if msg.charts else []
    return ChatMessageResponse(
        id=msg.id,
        session_id=msg.session_id,
        sender=msg.sender,
        text=msg.text,
        actions_executed=actions,
        charts=charts,
        created_at=msg.created_at
    )

def parseSessionFields(session: ChatSession) -> ChatSessionResponse:
    msgs = [parseMessageFields(m) for m in session.messages]
    return ChatSessionResponse(
        id=session.id,
        title=session.title,
        last_provider=session.last_provider,
        last_model=session.last_model,
        is_active=session.is_active,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=msgs
    )

@router.get("/sessions", response_model=List[ChatSessionResponse])
def listSessions(db: Session = Depends(getDb)):
    sessions = db.query(ChatSession).order_by(ChatSession.updated_at.desc()).all()
    return [parseSessionFields(s) for s in sessions]

@router.get("/sessions/active", response_model=ChatSessionResponse)
def getActiveSession(db: Session = Depends(getDb)):
    session = db.query(ChatSession).filter(ChatSession.is_active == True).first()
    if not session:
        session = db.query(ChatSession).order_by(ChatSession.updated_at.desc()).first()
        if session:
            session.is_active = True
            db.commit()
            db.refresh(session)
        else:
            session = ChatSession(title="Nova Conversa", is_active=True)
            db.add(session)
            db.commit()
            db.refresh(session)
    return parseSessionFields(session)

@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def createSession(title: Optional[str] = "Nova Conversa", db: Session = Depends(getDb)):
    # Desativa outras sessões
    db.query(ChatSession).update({ChatSession.is_active: False})
    
    session = ChatSession(title=title or "Nova Conversa", is_active=True)
    db.add(session)
    db.commit()
    db.refresh(session)
    return parseSessionFields(session)

@router.post("/sessions/{session_id}/activate", response_model=ChatSessionResponse)
def activateSession(session_id: int, db: Session = Depends(getDb)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sessão de chat não encontrada")
    
    db.query(ChatSession).update({ChatSession.is_active: False})
    session.is_active = True
    db.commit()
    db.refresh(session)
    return parseSessionFields(session)

@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def deleteSession(session_id: int, db: Session = Depends(getDb)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sessão de chat não encontrada")
    db.delete(session)
    db.commit()

@router.post("/transcribe")
async def transcribeAudio(
    file: UploadFile = File(...),
    provider_id: Optional[str] = Form(None),
    model_id: Optional[str] = Form(None),
    db: Session = Depends(getDb)
):
    audio_bytes = await file.read()
    mime_type = file.content_type or "audio/webm"

    used_provider = provider_id
    used_model = model_id

    # 1. Tenta transcrever com o agente do provedor/modelo selecionado
    agent = provider_config.getAgent(provider_id, model_id)
    try:
        text, in_tok, out_tok, tot_tok = await agent.transcribeAudio(audio_bytes, mime_type)
    except NotImplementedError:
        # Fallback para Gemini
        used_provider = "Gemini"
        used_model = "gemini-2.5-flash"
        gemini_agent = provider_config.getAgent("Gemini", "gemini-2.5-flash")
        text, in_tok, out_tok, tot_tok = await gemini_agent.transcribeAudio(audio_bytes, mime_type)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    usage = AIUsage(
        provider=used_provider or "Unknown",
        model=used_model or "Unknown",
        input_tokens=in_tok,
        output_tokens=out_tok,
        total_tokens=tot_tok,
        endpoint="transcribe"
    )
    db.add(usage)
    db.commit()

    return {"text": text}

@router.post("/chat", response_model=AgentResponse)
async def processChat(req: ChatRequest, db: Session = Depends(getDb)):
    # 1. Encontra a sessão de chat ativa ou especificada
    session = None
    if req.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == req.session_id).first()

    if not session:
        session = db.query(ChatSession).filter(ChatSession.is_active == True).first()
        if not session:
            session = ChatSession(title="Nova Conversa", is_active=True)
            db.add(session)
            db.commit()
            db.refresh(session)

    # 2. Atualiza provedor e modelo selecionados na sessão (persistência no .db)
    if req.provider_id:
        session.last_provider = req.provider_id
    if req.model_id:
        session.last_model = req.model_id

    # Auto-título para primeira mensagem
    if session.title == "Nova Conversa" and req.message:
        session.title = req.message[:35] + ("..." if len(req.message) > 35 else "")

    # 3. Salva mensagem do usuário no banco SQLite
    user_msg = ChatMessage(
        session_id=session.id,
        sender="user",
        text=req.message
    )
    db.add(user_msg)
    db.commit()

    # 4. Processa via IA Agent (Strategy Pattern)
    used_provider = req.provider_id or session.last_provider or "Unknown"
    used_model = req.model_id or session.last_model or "Unknown"
    agent = provider_config.getAgent(used_provider, used_model)
    response = await agent.processInput(user_text=req.message, context={"db": db})

    usage = AIUsage(
        provider=used_provider,
        model=used_model,
        input_tokens=response.input_tokens,
        output_tokens=response.output_tokens,
        total_tokens=response.total_tokens,
        endpoint="chat"
    )
    db.add(usage)

    # 5. Salva resposta do assistente no banco SQLite
    actions_json = json.dumps([a if isinstance(a, dict) else a.dict() for a in response.actions_executed]) if response.actions_executed else None
    charts_json = json.dumps([c if isinstance(c, dict) else c.dict() for c in response.charts]) if response.charts else None

    bot_msg = ChatMessage(
        session_id=session.id,
        sender="bot",
        text=response.message,
        actions_executed=actions_json,
        charts=charts_json
    )
    db.add(bot_msg)
    
    session.updated_at = db.query(ChatSession).first().updated_at  # Força atualização do timestamp
    db.commit()

    return response

@router.get("/usage", response_model=AIUsageSummary)
def getUsageStats(db: Session = Depends(getDb)):
    # Total history
    total_reqs = db.query(AIUsage).count()
    total_toks = db.query(func.sum(AIUsage.total_tokens)).scalar() or 0

    # Last 24 hours
    yesterday = datetime.utcnow() - timedelta(days=1)
    reqs_today = db.query(AIUsage).filter(AIUsage.created_at >= yesterday).count()

    # Calculate global RPM, TPM, RPD
    first_record = db.query(AIUsage).order_by(AIUsage.created_at.asc()).first()
    if first_record and total_reqs > 0:
        total_days = max(1.0, (datetime.utcnow() - first_record.created_at).total_seconds() / 86400.0)
        total_minutes = max(1.0, (datetime.utcnow() - first_record.created_at).total_seconds() / 60.0)
    else:
        total_days = 1.0
        total_minutes = 1.0

    global_rpm = total_reqs / total_minutes
    global_tpm = total_toks / total_minutes
    global_rpd = total_reqs / total_days

    # Models details
    models_usage = db.query(
        AIUsage.provider,
        AIUsage.model,
        func.count(AIUsage.id).label('requests'),
        func.sum(AIUsage.input_tokens).label('input_tokens'),
        func.sum(AIUsage.output_tokens).label('output_tokens'),
        func.sum(AIUsage.total_tokens).label('total_tokens')
    ).group_by(AIUsage.provider, AIUsage.model).all()

    model_details = []
    for m in models_usage:
        model_rpm = m.requests / total_minutes
        model_tpm = (m.total_tokens or 0) / total_minutes
        model_rpd = m.requests / total_days
        model_details.append(AIUsageModelDetails(
            provider=m.provider,
            model=m.model,
            requests=m.requests,
            input_tokens=m.input_tokens or 0,
            output_tokens=m.output_tokens or 0,
            total_tokens=m.total_tokens or 0,
            rpm=round(model_rpm, 2),
            tpm=round(model_tpm, 2),
            rpd=round(model_rpd, 2)
        ))

    return AIUsageSummary(
        total_requests=total_reqs,
        total_requests_today=reqs_today,
        total_tokens=total_toks,
        global_rpm=round(global_rpm, 2),
        global_tpm=round(global_tpm, 2),
        global_rpd=round(global_rpd, 2),
        models=model_details
    )
