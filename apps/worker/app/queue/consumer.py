import json
import redis as redis_lib
from app.config.settings import settings
from app.services.task_service import TaskService
from app.processors.task_processor import process_task
from app.utils.logger import info, error

QUEUE_KEY = "ai-task-queue"


def run_consumer() -> None:
    r = redis_lib.from_url(settings.redis_url, decode_responses=False)
    task_service = TaskService()

    info("Worker started", queue=QUEUE_KEY)

    try:
        while True:
            result = r.blpop(QUEUE_KEY, timeout=settings.poll_interval)

            if result is None:
                continue

            _key, raw = result
            raw_str = raw.decode("utf-8") if isinstance(raw, bytes) else raw

            try:
                job = json.loads(raw_str)
            except json.JSONDecodeError as e:
                error("Invalid job JSON", error=str(e))
                continue

            task_id = job.get("taskId")
            operation_type = job.get("operationType")
            input_text = job.get("inputText")

            if not all([task_id, operation_type, input_text]):
                error("Missing job fields", job=job)
                continue

            info("Job received", task_id=task_id)
            process_task(task_service, task_id, operation_type, input_text)

    except KeyboardInterrupt:
        info("Worker shutting down")
    finally:
        task_service.close()
        r.close()
