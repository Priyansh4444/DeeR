import io
from PyPDF2 import PdfReader
from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
import uvicorn
import logging
import cv2
import numpy as np
from hume import AsyncHumeClient
from hume.expression_measurement.stream import Config
from hume.expression_measurement.stream.socket_client import StreamConnectOptions
from hume.expression_measurement.stream.types import StreamFace
import math

from dotenv import load_dotenv
import os
load_dotenv()
HUME_API_KEY = os.getenv("NEXT_PUBLIC_HUME_API_KEY")

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize Chromadb client
client = chromadb.PersistentClient(path="./chroma_db")

# Get or create a collection for our documents
collection = client.get_or_create_collection(name="documents")

# List of emotions we're interested in
RELEVANT_EMOTIONS = ['Calmness', 'Concentration', 'Distress']


class QueryItem(BaseModel):
    query: str


class ContentItem(BaseModel):
    content: str


@app.post("/add-to-chroma")
async def add_to_chroma(item: ContentItem):
    collection.add(
        documents=[item.content],
        ids=[f"doc_{collection.count() + 1}"]
    )
    return {"status": "success", "message": "Content added to Chromadb"}


@app.post("/query-chroma")
async def query_chroma(item: QueryItem):
    results = collection.query(
        query_texts=[item.query],
        n_results=5
    )
    return {"results": results['documents'][0]}


@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        if file.filename.lower().endswith('.pdf'):
            # Handle PDF files
            pdf_reader = PdfReader(io.BytesIO(contents))
            text_content = ""
            for page in pdf_reader.pages:
                text_content += page.extract_text() + "\n"
        elif file.filename.lower().endswith(('.txt', '.md', '.py', '.js', '.html', '.css')):
            # Handle text-based files
            text_content = contents.decode('utf-8', errors='ignore')
        else:
            # For other file types, store file info or handle as needed
            text_content = f"File uploaded: {file.filename} (binary file)"

        # Add file content to Chromadb
        collection.add(
            documents=[text_content],
            ids=[f"file_{collection.count() + 1}"]
        )
        return {"status": "success", "message": f"File {file.filename} uploaded and added to Chromadb"}
    except Exception as e:
        logging.error(f"Error uploading file: {str(e)}")
        return {"status": "error", "message": str(e)}


async def process_image_with_hume(image):
    logging.info("Processing image with Hume...")
    try:
        # Initialize Hume client

        client = AsyncHumeClient(
            api_key=HUME_API_KEY)
        model_config = Config(face=StreamFace())
        stream_options = StreamConnectOptions(config=model_config)

        # Save the image to a temporary file
        cv2.imwrite("temp_image.png", image)

        # Connect to the Hume API
        async with client.expression_measurement.stream.connect(options=stream_options) as socket:
            logging.info("Sending image data to Hume...")
            result = await socket.send_file("temp_image.png")
            logging.info("Received response from Hume.")
            return result
    except Exception as e:
        logging.error(f"Error processing image with Hume: {str(e)}")
        return {'error': str(e)}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        try:
            image_data = await websocket.receive_bytes()

            # Convert raw frame data to numpy array
            nparr = np.frombuffer(image_data, np.uint8)

            # Assuming the frame is in RGBA format and 640x480 resolution
            # Adjust these values if your frame format or resolution is different
            image = nparr.reshape((480, 640, 4))

            image_bgr = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)

            # Process image with Hume
            image_result = await process_image_with_hume(image_bgr)

            # Check if the result contains emotions and process them
            if hasattr(image_result, 'face') and image_result.face.predictions:
                predictions = image_result.face.predictions[0]
                processed_emotions = process_emotions(predictions.emotions)

                # Send the response back to the client
                await websocket.send_json({
                    "emotions": processed_emotions,
                    "face_detected": True,
                    "face_probability": predictions.prob
                })
            else:
                await websocket.send_json({
                    "emotions": [],
                    "face_detected": False,
                    "error": "No face detected"
                })

        except WebSocketDisconnect:
            logging.info("WebSocket disconnected")
            break
        except Exception as e:
            logging.error(f"Error in WebSocket connection: {str(e)}")
            await websocket.send_json({"error": str(e)})

    await websocket.close()


def process_emotions(emotions):
    relevant_emotions = {
        emotion.name: emotion.score for emotion in emotions if emotion.name in RELEVANT_EMOTIONS
    }

    # Apply corrections to account for model bias
    corrections = {
        'Calmness': 0.1,  # Reduce calmness
        'Concentration': 0.1,  # Slightly reduce concentration
        'Distress': 0.1  # Increase distress
    }

    corrected_emotions = {
        name: score * corrections[name] for name, score in relevant_emotions.items()
    }

    # Exaggerate differences using a sigmoid function
    max_score = max(corrected_emotions.values())
    exaggerated_emotions = {
        name: 1 / (1 + math.exp(-10 * (score / max_score - 0.5)))
        for name, score in corrected_emotions.items()
    }

    total = sum(exaggerated_emotions.values())

    if total > 0:
        normalized_emotions = {
            name: score / total for name, score in exaggerated_emotions.items()
        }
        return [{"name": name, "score": score} for name, score in normalized_emotions.items()]
    return []


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
