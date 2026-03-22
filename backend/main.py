import asyncio
import time

import httpx


async def periodic_task():
    counter = 0
    interval = 5
    next_run = time.monotonic()

    async with httpx.AsyncClient() as client:
        while True:
            await client.post("http://127.0.0.1:8000/pulse", json={"value": counter})
            counter += 1

            next_run += interval
            await asyncio.sleep(max(0, next_run - time.monotonic()))


if __name__ == "__main__":
    asyncio.run(periodic_task())
