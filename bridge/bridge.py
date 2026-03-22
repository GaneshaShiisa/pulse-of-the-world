import socketio
from fastapi import FastAPI

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
app = FastAPI()
asgi_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path="socket.io")


@app.post("/pulse")
async def pulse(data: dict):
    await sio.emit("triad_pulse", {"msg": "Pulse...", "payload": data})
    return {"status": "ok"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@sio.event
async def connect(sid, environ):
    print(f"Pulse: Surface connected: {sid}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(asgi_app, host="0.0.0.0", port=8000)
