import sys
import json
from datetime import datetime, timezone


def _log(level: str, message: str, **meta) -> None:
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "message": message,
        **meta,
    }
    print(json.dumps(entry), file=sys.stderr)


def info(message: str, **meta) -> None:
    _log("info", message, **meta)


def warn(message: str, **meta) -> None:
    _log("warn", message, **meta)


def error(message: str, **meta) -> None:
    _log("error", message, **meta)


def debug(message: str, **meta) -> None:
    _log("debug", message, **meta)
