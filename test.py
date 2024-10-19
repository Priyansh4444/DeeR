import asyncio
import cv2
import os
import tempfile
from hume import AsyncHumeClient
from hume.expression_measurement.stream import Config
from hume.expression_measurement.stream.socket_client import StreamConnectOptions
from hume.expression_measurement.stream.types import StreamFace
import logging

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')


async def process_image_with_hume(image_filepath):
    logging.info("Processing image with Hume...")
    try:
        # Initialize Hume client
        client = AsyncHumeClient(
            base_url="https://api.hume.ai/v0/batch/jobs/tl/inference",
            api_key="AQzwr7sj6DwoRBRxHWaqs93VfY6vp1Z1X2GneqL3kaJrTxZ6",
        )
        model_config = Config(face=StreamFace())
        stream_options = StreamConnectOptions(config=model_config)

        # Connect to the Hume API
        async with client.expression_measurement.stream.connect(options=stream_options) as socket:
            logging.info("Sending image data to Hume...")
            result = await socket.send_file(image_filepath)

            logging.info("Received response from Hume.")
            return result

    except Exception as e:
        logging.error(f"Error processing image with Hume: {str(e)}")
        return {'error': str(e)}


def normalize_emotions(calm, conc, dist):
    # Extract scores for specific emotions
    calmness = calm if calm > 0 else 0.25
    concentration = conc if conc > 0 else 0.25
    distress = dist if dist > 0 else 0.25

    total = calmness + concentration + distress
    if total > 0:
        # Normalize scores
        return {
            'Calmness': calmness / total,
            'Concentration': concentration / total,
            'Distress': distress / total,
        }
    else:
        return {
            'Calmness': 0,
            'Concentration': 0,
            'Distress': 0,
        }


def capture_and_process_video():
    # Start capturing video from the webcam
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        logging.error("Error: Could not open video.")
        return

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                logging.error("Error: Could not read frame.")
                break

            # Capture image every 10 seconds
            # Create a temporary file to store the captured image
            with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
                image_filepath = temp_file.name
                cv2.imwrite(image_filepath, frame)

            logging.info("Capturing image...")
            image_result = asyncio.run(process_image_with_hume(image_filepath))

            # Check if the result contains emotions and normalize them
            image_result = image_result.face
            predictions = image_result.predictions[0]
            for emotions in predictions.emotions:
                if emotions.name == 'Calmness':
                    calmness = emotions.score
                if emotions.name == 'Concentration':
                    concentration = emotions.score
                if emotions.name == 'Distress':
                    distress = emotions.score
            normalized_emotions = normalize_emotions(
                calmness, concentration, distress)

            # Print the normalized results
            print("Normalized Emotion Scores:", normalized_emotions)
            print("Result:", type(image_result))

            # Wait for 10 seconds before capturing the next image
            cv2.waitKey(10000)  # Wait for 10000 milliseconds (10 seconds)

    finally:
        cap.release()
        cv2.destroyAllWindows()
        logging.info("Video capture ended.")


if __name__ == "__main__":
    capture_and_process_video()
