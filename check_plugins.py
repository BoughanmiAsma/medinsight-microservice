import requests
import json

try:
    resp = requests.get('http://localhost:8201/plugins')
    if resp.status_code != 200:
        print(f"Error: {resp.status_code}")
        print(resp.text)
    else:
        plugins = resp.json().get('data', [])
        for p in plugins:
            print(f"Plugin: {p.get('name')}")
            service = p.get('service')
            route = p.get('route')
            print(f"Service ID: {service.get('id') if service else 'None'}")
            print(f"Route ID: {route.get('id') if route else 'None'}")
            print("Config:")
            # Use json.dumps safely
            print(json.dumps(p.get('config', {}), indent=2))
            print("-" * 40)
except Exception as e:
    import traceback
    traceback.print_exc()
