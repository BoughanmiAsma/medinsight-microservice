import requests
import json

url = 'http://localhost:8201/services/staff-service'
payload = {
    'host': 'staff-service',
    'port': 9002
}

try:
    response = requests.patch(url, json=payload)
    if response.status_code == 200:
        print("Successfully updated staff-service configuration.")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error updating service: {response.status_code} - {response.text}")
except Exception as e:
    print(f"Exception: {e}")
