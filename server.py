from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

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
    return {"status": "API en ligne", "version": "4.0"}

@app.get("/api/discord-status")
def get_discord_status():
    try:
        response = requests.get(DISCORD_STATUS_URL, timeout=10)
        data = response.json()

        raw_components = data.get("components", [])
        api_services = []
        region_services = []

        # Liste exacte des mots-clés appartenant STRICTEMENT aux API et Services globaux
        global_keywords = [
            "api", "desktop", "ios", "android", "web", "search", 
            "gateway", "cloudflare", "media proxy", "push notifications", 
            "creator payouts", "tax calculation", "third-party", 
            "server web pages", "client", "payments", "marketing site"
        ]

        for item in raw_components:
            name = item.get("name", "").lower()
            
            # Si le nom contient un des mots-clés globaux -> Graphique de gauche
            if any(keyword in name for keyword in global_keywords):
                api_services.append(item)
            else:
                # Tout le reste (villes, pays, régions vocales) -> Graphique de droite
                region_services.append(item)

        status_obj = data.get("status", {})

        return {
            "status_indicator": status_obj.get("indicator", "none"),
            "status_description": status_obj.get("description", "Tous les systèmes sont opérationnels"),
            "api_services": api_services,
            "region_services": region_services
        }
    except Exception as e:
        return {
            "status_indicator": "error",
            "status_description": f"Erreur : {str(e)}",
            "api_services": [],
            "region_services": []
        }
