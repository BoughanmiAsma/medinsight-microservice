import requests
import sys

# Test connectivity via Kong
ROUTES = [
    "http://localhost:8200/staffs",
    "http://localhost:8200/dossiers",
    "http://localhost:8200/api/dossiers",
    "http://localhost:8200/prescriptions",
    "http://localhost:8200/api/prescriptions",
    "http://localhost:8200/api/lab-orders"
]

for url in ROUTES:
    try:
        print(f"Testing {url}...")
        response = requests.get(url, timeout=5)
        print(f"  Status: {response.status_code}")
    except Exception as e:
        print(f"  Error: {e}")
