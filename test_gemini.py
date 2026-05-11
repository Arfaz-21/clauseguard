import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

def test_api():
    print(f"Testing API Key: {api_key[:8]}...{api_key[-4:]}")
    try:
        client = genai.Client(api_key=api_key)
        print("Listing models...")
        for model in client.models.list():
            print(f" - Found model: {model.name}")
        
        # Try with a common model name
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents="Hello, are you active?"
        )
        print("✅ SUCCESS: API Key is active and generated content!")
        print(f"Response: {response.text}")
    except Exception as e:
        print("❌ FAILURE: API Key issue detected.")
        print(f"Error Details: {e}")

if __name__ == "__main__":
    test_api()
