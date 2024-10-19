import { Message } from "./types";

const API_URL = "https://api.hyperbolic.xyz/v1/chat/completions";
const BACKEND_URL = "http://localhost:8001";

export const addToChromaDB = async (content: string) => {
  try {
    await fetch(`${BACKEND_URL}/add-to-chroma`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });
  } catch (error) {
    console.error("Error adding to ChromaDB:", error);
  }
};

export const getRelevantContext = async (query: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/query-chroma`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error querying ChromaDB:", error);
    return [];
  }
};

export const sendMessageToAPI = async (messages: Message[], input: string) => {
  const API_KEY = process.env.NEXT_PUBLIC_HYPERBOLIC_API_KEY;
  const relevantContext = await getRelevantContext(input);
  await addToChromaDB(input);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: `Relevant context: ${relevantContext.join(
            ". "
          )} Your Role: You are a professional Teacher Who loves the Richard Feynman Method of learning!
      You will be informed on what to do later on,
      till then just help the user out with learning whatever he asks you!`,
        },
        ...messages,
        { role: "user", content: input },
      ],
      model: "meta-llama/Meta-Llama-3.1-405B-Instruct",
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 0.9,
      stream: true,
    }),
  });

  return response;
};

export const handleFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BACKEND_URL}/upload-file`, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("File upload failed");
  }

  return await response.json();
};
