import requests
import json

try:
    plugins = requests.get('http://localhost:8201/plugins').json()['data']
    oidc = [p for p in plugins if p['name'] == 'oidc'][0]
    print(json.dumps(oidc['config'], indent=2))
except Exception as e:
    print(f"Error: {e}")
