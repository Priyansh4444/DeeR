from functools import lru_cache
import io
from typing import List
from PyPDF2 import PdfReader
from fastapi import FastAPI, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
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
import asyncio
from perplexity import multi_model_learning_chain

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


@lru_cache(maxsize=1)
def get_hume_client():
    return AsyncHumeClient(api_key=HUME_API_KEY)


async def process_image_stream(websocket: WebSocket):
    client = get_hume_client()
    model_config = Config(face=StreamFace())
    stream_options = StreamConnectOptions(config=model_config)

    async with client.expression_measurement.stream.connect(options=stream_options) as socket:
        while True:
            try:
                image_data = await asyncio.wait_for(websocket.receive_bytes(), timeout=5.0)

                # Convert raw frame data to numpy array
                nparr = np.frombuffer(image_data, np.uint8)
                image = nparr.reshape((480, 640, 4))
                image_bgr = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)

                # Save the image to a temporary file
                temp_file = "temp_image.png"
                cv2.imwrite(temp_file, image_bgr)

                # Send the file to Hume
                result = await socket.send_file(temp_file)

                # Clean up the temporary file
                os.remove(temp_file)

                # Process the result
                if hasattr(result, 'face') and result.face.predictions:
                    predictions = result.face.predictions[0]
                    processed_emotions = process_emotions(predictions.emotions)
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

            except asyncio.TimeoutError:
                logging.warning("WebSocket receive timeout")
            except Exception as e:
                logging.error(f"Error in image processing: {str(e)}")
                await websocket.send_json({"error": str(e)})
                break


def process_emotions(emotions):
    relevant_emotions = {
        emotion.name: emotion.score
        for emotion in emotions if emotion.name in RELEVANT_EMOTIONS
    }
    return [{"name": name, "score": score} for name, score in relevant_emotions.items()]


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        await process_image_stream(websocket)
    except WebSocketDisconnect:
        logging.info("WebSocket disconnected")
    finally:
        await websocket.close()


class Message(BaseModel):
    role: str
    content: str


class SummaryRequest(BaseModel):
    messages: List[Message]


@app.post("/generate-summary")
async def generate_summary(request: SummaryRequest):
    try:
        # Extract the user's input (last message in the list)
        user_input = request.messages[-1].content

        # Extract the relevant context from the system message
        system_message = next(
            (msg for msg in request.messages if msg.role == "system"), None)
        relevant_context = system_message.content if system_message else ""

        # Combine relevant context, message history, and user input
        full_context = f"{relevant_context}\n\nConversation history:\n"
        # Exclude system message and last user message
        for msg in request.messages[1:-1]:
            full_context += f"{msg.role.capitalize()}: {msg.content}\n"
        full_context += f"\nUser's question: {user_input}"

        # Generate summary using the multi-model learning chain
        summary = multi_model_learning_chain(full_context)

        return {"status": "success", "summary": summary}
    except Exception as e:
        logging.error(f"Error generating summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
