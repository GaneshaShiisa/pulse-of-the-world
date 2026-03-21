import asyncio

import socketio

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


async def periodic_task():
    counter = 0
    while True:
        await sio.emit(
            "triad_pulse", {"msg": "Pulse...", "payload": {"value": counter}}
        )
        counter += 1
        await asyncio.sleep(5)


class LifespanApp:
    def __init__(self, sio_app):
        self.sio_app = sio_app

    async def __call__(self, scope, receive, send):

        if scope["type"] == "lifespan":
            await self.startup(send)
        else:
            await self.sio_app(scope, receive, send)

    async def startup(self, send):
        print("Starting up...")
        asyncio.create_task(periodic_task())
        await send({"type": "lifespan.startup.complete"})


sio_app = socketio.ASGIApp(sio)
app = LifespanApp(sio_app)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
