import requests
import json

try:
    services = requests.get('http://localhost:8201/services').json()
    print("Services in Kong:")
    for s in services['data']:
        print(f"- {s['name']}: {s['host']}:{s['port']}")
    
    routes = requests.get('http://localhost:8201/routes').json()
    print("\nRoutes in Kong:")
    for r in routes['data']:
        print(f"- {r.get('name', 'unnamed')}: {r['paths']} -> {r['service']['id']}")
except Exception as e:
    print(f"Error: {e}")
