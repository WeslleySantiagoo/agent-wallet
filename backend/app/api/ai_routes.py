import json
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.database import getDb
from app.db.models import ChatSession, ChatMessage
from app.schemas.schemas import ChatSessionResponse, ChatMessageResponse
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
    model_id: Optional[str] = Form(None)
):
    audio_bytes = await file.read()
    mime_type = file.content_type or "audio/webm"

    # 1. Tenta transcrever com o agente do provedor/modelo selecionado
    agent = provider_config.getAgent(provider_id, model_id)
    try:
        text = await agent.transcribeAudio(audio_bytes, mime_type)
        return {"text": text}
    except NotImplementedError:
        # Fallback para Gemini
        gemini_agent = provider_config.getAgent("Gemini", "gemini-2.5-flash")
        text = await gemini_agent.transcribeAudio(audio_bytes, mime_type)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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
    agent = provider_config.getAgent(req.provider_id or session.last_provider, req.model_id or session.last_model)
    response = await agent.processInput(user_text=req.message, context={"db": db})

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
