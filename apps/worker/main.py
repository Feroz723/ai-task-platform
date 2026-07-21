"""AI Task Processing Worker — Entry point."""

from app.queue.consumer import run_consumer
from app.utils.logger import info


def main() -> None:
    info("AI Task Worker starting")
    run_consumer()


if __name__ == "__main__":
    main()
