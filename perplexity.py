import os
from groq import Groq
import google.generativeai as genai
import requests
from dotenv import load_dotenv


def multi_model_learning_chain(concept):
    print("Starting multi_model_learning_chain")
    load_dotenv()
    groq_api_key = os.environ.get("GROQ_API_KEY")
    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    hyperbolic_api_key = os.environ.get("NEXT_PUBLIC_HYPERBOLIC_API_KEY")

    print("API keys loaded")

    # Stage 1: Initial Analysis (Hyperbolic)
    print("Starting Hyperbolic analysis")
    initial_analysis = hyperbolic_analysis(hyperbolic_api_key, concept)
    print("Hyperbolic analysis completed")

    # Stage 2: Simplification and Feynman Technique (Gemini)
    print("Starting Gemini simplification and Feynman technique")
    simple_explanation, feynman_explanation = gemini_simplify_and_feynman(
        gemini_api_key, initial_analysis)
    print("Gemini process completed")

    # Stage 3: Analogies and Final Summary (Groq)
    print("Starting Groq analogies and summary")
    analogies, final_summary = groq_analogies_and_summary(
        groq_api_key, concept, initial_analysis, simple_explanation, feynman_explanation)
    print("Groq process completed")

    return final_summary


def hyperbolic_analysis(api_key, concept):
    print("Inside hyperbolic_analysis function")
    url = "https://api.hyperbolic.xyz/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    data = {
        "messages": [
            {
                "role": "user",
                "content": f"Provide a comprehensive and deep analysis of the concept: {concept}. Include key principles, theories, and any relevant scientific or academic context."
            }
        ],
        "model": "meta-llama/Meta-Llama-3.1-70B-Instruct",
        "max_tokens": 2048,
        "temperature": 0.7,
        "top_p": 0.9
    }
    print("Sending request to Hyperbolic API")
    response = requests.post(url, headers=headers, json=data)
    print(f"Received response from Hyperbolic API. Status code: {
          response.status_code}")
    response_data = response.json()
    print("Response data:", response_data)
    return response_data['choices'][0]['message']['content']


def gemini_simplify_and_feynman(api_key, analysis):
    print("Inside gemini_simplify_and_feynman function")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    print("Generating simple explanation")
    simplify_prompt = f"Simplify the following analysis for easy understanding:\n\n{
        analysis}"
    simple_response = model.generate_content(simplify_prompt)
    print("Simple explanation generated")

    print("Generating Feynman explanation")
    feynman_prompt = f"Using the Feynman Technique, explain the concept as if teaching to someone else:\n\n{
        simple_response.text}"
    feynman_response = model.generate_content(feynman_prompt)
    print("Feynman explanation generated")

    return simple_response.text, feynman_response.text


def groq_analogies_and_summary(api_key, concept, analysis, simple_explanation, feynman_explanation):
    print("Inside groq_analogies_and_summary function")
    client = Groq(api_key=api_key)

    print("Generating analogies")
    analogy_prompt = f"Generate insightful analogies to explain the concept of {
        concept} based on this analysis:\n\n{analysis}"
    analogy_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": analogy_prompt}],
        model="llama3-8b-8192",
    )
    analogies = analogy_completion.choices[0].message.content
    print("Analogies generated")

    print("Generating final summary")
    summary_prompt = f"Integrate and summarize the following information about {concept} into a comprehensive learning resource:\n\nAnalysis: {
        analysis}\n\nSimple Explanation: {simple_explanation}\n\nFeynman Technique Explanation: {feynman_explanation}\n\nAnalogies: {analogies}"
    summary_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": summary_prompt}],
        model="llama3-8b-8192",
    )
    final_summary = summary_completion.choices[0].message.content
    print("Final summary generated")

    return analogies, final_summary


# Example usage
concept_to_learn = "Quantum Entanglement"
print(f"Starting learning process for concept: {concept_to_learn}")
learning_material = multi_model_learning_chain(concept_to_learn)
print("Final learning material:")
print(learning_material)
