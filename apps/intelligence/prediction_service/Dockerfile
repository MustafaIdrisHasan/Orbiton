FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgomp1 && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install -e .

COPY shared ./shared
COPY prediction_service ./prediction_service

# Train a baseline model at image-build time so the container can serve
# without an external training step. Override this in CI/CD if you have
# institutional data.
RUN python -m prediction_service.pipeline.train --output /app/prediction_service/models/current || true

EXPOSE 8003
CMD ["uvicorn", "prediction_service.main:app", "--host", "0.0.0.0", "--port", "8003"]
