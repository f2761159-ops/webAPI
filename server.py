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

# URL officielle corrigée
DISCORD_STATUS_URL = "https://discordstatus.com/api/v2/summary.json"

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
            if "Voice" in name or "Server" in name or "Region" in name:
                if any(region in name.lower() for region in ["france", "rotterdam", "eu-west", "europe"]):
                    filtered_components.append(item)
            else:
                filtered_components.append(item)

        status_obj = data.get("status", {})

        return {
            "status_indicator": status_obj.get("indicator", "none"),
            "status_description": status_obj.get("description", "Tous les systèmes sont opérationnels"),
            "components": filtered_components
        }
    except Exception as e:
        return {
            "status_indicator": "error",
            "status_description": f"Erreur : {str(e)}",
            "components": []
        }
