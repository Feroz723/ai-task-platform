from datetime import datetime, timezone
from pymongo import MongoClient
from pymongo.collection import Collection
from app.config.settings import settings
from app.utils.logger import info


class TaskService:
    def __init__(self) -> None:
        client = MongoClient(settings.mongo_uri)
        self._tasks: Collection = client[settings.mongo_db]["tasks"]

    def get_task(self, task_id: str) -> dict | None:
        from bson.objectid import ObjectId
        return self._tasks.find_one({"_id": ObjectId(task_id)})

    def mark_running(self, task_id: str) -> None:
        from bson.objectid import ObjectId
        self._tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"status": "running"}},
        )

    def mark_success(self, task_id: str, result: str) -> None:
        from bson.objectid import ObjectId
        self._tasks.update_one(
            {"_id": ObjectId(task_id)},
            {
                "$set": {"status": "success", "result": result},
            },
        )

    def mark_failed(self, task_id: str, error_message: str) -> None:
        from bson.objectid import ObjectId
        self._tasks.update_one(
            {"_id": ObjectId(task_id)},
            {
                "$set": {"status": "failed", "result": error_message},
            },
        )

    def append_log(self, task_id: str, message: str) -> None:
        from bson.objectid import ObjectId
        timestamp = datetime.now(timezone.utc).isoformat()
        log_entry = f"[{timestamp}] {message}"
        self._tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$push": {"logs": log_entry}},
        )

    def close(self) -> None:
        info("Closing MongoDB connection")
