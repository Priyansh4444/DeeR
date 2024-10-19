import math
import asyncio
import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from hume import AsyncHumeClient
from hume.expression_measurement.stream import Config
from hume.expression_measurement.stream.socket_client import StreamConnectOptions
from hume.expression_measurement.stream.types import StreamFace
import logging
import uvicorn
from chromadb.config import Settings
from chromadb.utils import embedding_functions
from chromadb import Client
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

# FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# List of emotions we're interested in
RELEVANT_EMOTIONS = ['Calmness', 'Concentration', 'Distress']

# Initialize Sentence Transformer model
sentence_model = SentenceTransformer('all-MiniLM-L6-v2')

# Create a custom embedding function


class SentenceTransformerEmbeddingFunction(embedding_functions.EmbeddingFunction):
    def __call__(self, texts):
        return sentence_model.encode(texts).tolist()


# Initialize ChromaDB with the custom embedding function
chroma_client = Client(Settings(
    chroma_db_impl="duckdb+parquet",
    persist_directory="./chroma_db"
))

embedding_func = SentenceTransformerEmbeddingFunction()

collection = chroma_client.get_or_create_collection(
    name="chat_history", embedding_function=embedding_func)


class ChatMessage(BaseModel):
    content: str


class QueryMessage(BaseModel):
    query: str


async def process_image_with_hume(image):
    logging.info("Processing image with Hume...")
    try:
        # Initialize Hume client
        client = AsyncHumeClient(
            api_key="AQzwr7sj6DwoRBRxHWaqs93VfY6vp1Z1X2GneqL3kaJrTxZ6")
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


@app.post("/add-to-chroma")
async def add_to_chroma(message: ChatMessage):
    try:
        collection.add(
            documents=[message.content],
            ids=[str(len(collection.get()['ids']) + 1)]
        )
        return {"message": "Content added to ChromaDB"}
    except Exception as e:
        logging.error(f"Error adding to ChromaDB: {str(e)}")
        return {"error": "Internal server error"}


@app.post("/query-chroma")
async def query_chroma(query: QueryMessage):
    try:
        results = collection.query(
            query_texts=[query.query],
            n_results=5
        )
        return {"results": results['documents'][0]}
    except Exception as e:
        logging.error(f"Error querying ChromaDB: {str(e)}")
        return {"error": "Internal server error"}


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
        'Calmness': 0.7,  # Reduce calmness
        'Concentration': 0.8,  # Slightly reduce concentration
        'Distress': 1.5  # Increase distress
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
    uvicorn.run(app, host='0.0.0.0', port=8000)
