"""Celery application for async resume parsing.

Broker: Redis (shared with the Node API's BullMQ instance — different
key namespaces so they don't collide).
"""
from __future__ import annotations

from celery import Celery

from shared.config import get_settings

settings = get_settings()

celery_app = Celery(
    "orbiton_resume",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["resume_service.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_default_queue="resume.parse",
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_time_limit=300,           # 5 min hard kill
    task_soft_time_limit=240,      # 4 min soft warning
)
