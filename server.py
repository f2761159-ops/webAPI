from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

# Ne pas modifier ce nom : Uvicorn cherche exactement la variable 'app'
app = FastAPI()

# Autorise ton site web HTML à interroger l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DISCORD_STATUS_URL = "https://sstatus.discordapp.com/api/v2/summary.json"

@app.get("/")
def home():
    return {"status": "API en ligne", "version": "2.0"}

@app.get("/api/discord-status")
def get_discord_status():
    try:
        response = requests.get(DISCORD_STATUS_URL, timeout=10)
        data = response.json()

        raw_components = data.get("components", [])
        filtered_components = []

        for item in raw_components:
            name = item.get("name", "")

            # Filtrage des serveurs vocaux/régionaux : garde uniquement la France / Europe
            if "Voice" in name or "Server" in name or "Region" in name:
                if any(region in name.lower() for region in ["france", "rotterdam", "eu-west", "europe"]):
                    filtered_components.append(item)
            else:
                # Tous les autres services globaux (API, Gateway, Web, etc.) sont conservés
                filtered_components.append(item)

        return {
            "status_indicator": data.get("status", {}).get("indicator", "none"),
            "status_description": data.get("status", {}).get("description", "Tous les systèmes sont opérationnels"),
            "page_info": data.get("page", {}),
            "components": filtered_components,
            "incidents": data.get("incidents", [])
        }
    except Exception as e:
        return {"error": str(e), "components": []}
