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
    return {"status": "API en ligne", "version": "3.0"}

@app.get("/api/discord-status")
def get_discord_status():
    try:
        response = requests.get(DISCORD_STATUS_URL, timeout=10)
        data = response.json()

        raw_components = data.get("components", [])
        api_services = []
        region_services = []

        # Liste de mots-clés pour identifier les régions/pays
        region_keywords = [
            "brazil", "rotterdam", "hong kong", "russia", "singapore", 
            "south africa", "us east", "us west", "us central", "sydney", 
            "japan", "india", "europe", "france", "voice"
        ]

        for item in raw_components:
            name = item.get("name", "")
            # Séparation entre les régions et les services principaux (API/Web/etc.)
            if any(keyword in name.lower() for keyword in region_keywords):
                region_services.append(item)
            else:
                api_services.append(item)

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
