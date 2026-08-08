from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DISCORD_STATUS_URL = "https://discordstatus.com/api/v2/summary.json"

@app.get("/")
def home():
    return {"status": "API en ligne", "version": "5.0"}

@app.get("/api/discord-status")
def get_discord_status():
    try:
        # Enregistrement du temps exact avant l'appel à l'API Discord
        start_time = time.time()
        
        # Requête directe vers les serveurs de Discord
        response = requests.get(DISCORD_STATUS_URL, timeout=10)
        
        # Enregistrement du temps après réception de la réponse
        end_time = time.time()

        # Temps de réponse réel de l'API Discord en millisecondes (ms)
        latency_ms = round((end_time - start_time) * 1000)

        data = response.json()
        raw_components = data.get("components", [])
        api_services = []
        region_services = []

        global_keywords = [
            "api", "desktop", "ios", "android", "web", "search", 
            "gateway", "cloudflare", "media proxy", "push notifications", 
            "creator payouts", "tax calculation", "third-party", 
            "server web pages", "client", "payments", "marketing site"
        ]

        for item in raw_components:
            name = item.get("name", "").lower()
            if any(keyword in name for keyword in global_keywords):
                api_services.append(item)
            else:
                region_services.append(item)

        status_obj = data.get("status", {})

        return {
            "status_indicator": status_obj.get("indicator", "none"),
            "status_description": status_obj.get("description", "Tous les systèmes sont opérationnels"),
            "latency_ms": latency_ms,
            "api_services": api_services,
            "region_services": region_services
        }
    except Exception as e:
        return {
            "status_indicator": "error",
            "status_description": f"Erreur : {str(e)}",
            "latency_ms": 0,
            "api_services": [],
            "region_services": []
        }
