FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONPATH=/app
RUN groupadd --system --gid 10001 phoenix && useradd --system --uid 10001 --gid 10001 --home-dir /app phoenix
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py availability.py .
USER 10001
EXPOSE 8093
CMD ["uvicorn","app:APP","--host","0.0.0.0","--port","8093","--workers","1","--no-proxy-headers"]
