FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgomp1 && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install -e .

COPY shared ./shared
COPY matching_service ./matching_service

EXPOSE 8002
CMD ["uvicorn", "matching_service.main:app", "--host", "0.0.0.0", "--port", "8002"]
