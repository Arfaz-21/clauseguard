import requests
import json

try:
    response = requests.get("http://127.0.0.1:8000/api/health", timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
