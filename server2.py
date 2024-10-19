from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import chromadb
from chromadb.config import Settings
import os
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

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
    contents = await file.read()
    text_content = contents.decode("utf-8")

    # Add file content to Chromadb
    collection.add(
        documents=[text_content],
        ids=[f"file_{collection.count() + 1}"]
    )

    return {"status": "success", "message": f"File {file.filename} uploaded and added to Chromadb"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


