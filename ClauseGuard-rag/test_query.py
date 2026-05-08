import requests
import json

payload = {
    "question": "What are the rules regarding security deposit according to the Model Tenancy Act 2021?",
    "top_k": 3
}

try:
    print("Sending query to /api/query...")
    response = requests.post("http://127.0.0.1:8000/api/query", json=payload, timeout=60)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
