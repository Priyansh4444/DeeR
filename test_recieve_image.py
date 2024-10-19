from fastapi import FastAPI, WebSocket
import numpy as np
import cv2
import uvicorn

app = FastAPI()

@app.get("/")
async def index():
    return {"message": "Server is running"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_bytes()
        # Convert the Uint8Array buffer to a numpy array
        np_arr = np.frombuffer(data, dtype=np.uint8)
        # Decode the image
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        # Save the image
        cv2.imwrite('received_image.jpg', img)
        await websocket.send_json({'status': 'Image received and saved'})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)