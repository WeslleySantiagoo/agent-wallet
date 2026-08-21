FROM python:3.11-slim

WORKDIR /app

# Instala dependências de sistema necessárias
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc sqlite3 libsqlite3-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app
COPY ./data ./data

RUN mkdir -p /app/data

HEALTHCHECK --interval=30s --timeout=3s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
