import asyncio
from threading import Thread
from typing import Any

from celery import Celery
from celery.signals import beat_init, worker_init
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)
celery_app = Celery(__name__)


@beat_init.connect()
@worker_init.connect()
def setup(**kwargs: Any) -> None:
    print("Initializing Celery worker process and asyncio thread.")
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    t = Thread(target=lambda loop: loop.run_forever(), args=(loop,))
    t.start()
