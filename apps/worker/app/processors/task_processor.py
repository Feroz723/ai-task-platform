from app.services.task_service import TaskService
from app.utils.logger import info


def _execute_operation(operation_type: str, input_text: str) -> str:
    if operation_type == "uppercase":
        return input_text.upper()
    elif operation_type == "lowercase":
        return input_text.lower()
    elif operation_type == "reverse":
        return input_text[::-1]
    elif operation_type == "word_count":
        return str(len(input_text.split()))
    else:
        raise ValueError(f"Unknown operation type: {operation_type}")


def process_task(
    task_service: TaskService,
    task_id: str,
    operation_type: str,
    input_text: str,
) -> None:
    try:
        info("Processing started", task_id=task_id, operation=operation_type)

        task_service.mark_running(task_id)
        task_service.append_log(task_id, "Processing started")

        result = _execute_operation(operation_type, input_text)

        task_service.mark_success(task_id, result)
        task_service.append_log(task_id, "Processing completed")

        info("Processing completed", task_id=task_id, result=result)

    except Exception as e:
        error_msg = str(e)
        info("Processing failed", task_id=task_id, error=error_msg)
        task_service.mark_failed(task_id, error_msg)
        task_service.append_log(task_id, f"Processing failed: {error_msg}")
