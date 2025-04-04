import asyncio
import logging
import os
import sys

sys.path.append(os.getcwd())
from scripts.database_util import get_database  # noqa: E402


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    db = get_database()
    await db.drop_tables()


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
