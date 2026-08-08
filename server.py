from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

DISCORD_SUMMARY_URL = "https://discordstatus.com/api/v2/summary.json"
DISCORD_INCIDENTS_URL = "https://discordstatus.com/api/v2/incidents.json"

# Base de données temporaire en mémoire pour les annonces administratives
custom_announcements = [
    {"id": 1, "text": "Bienvenue sur le Dashboard de surveillance Discord.", "type": "info"}
]

class PasswordCheck(BaseModel):
    password: str

class AnnouncementItem(BaseModel):
    text: str
    type: str = "info"

@app.get("/")
def home():
    return {"status": "API en ligne", "version": "6.0"}

@app.post("/api/login")
def login(data: PasswordCheck):
    if data.password == "Administrateur2517@":
        return {"role": "admin", "message": "Accès Administrateur accordé"}
    elif data.password == "Membre":
        return {"role": "member", "message": "Accès Membre accordé"}
    else:
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")

@app.get("/api/discord-status")
def get_discord_status():
    try:
        start_time = time.time()
        response = requests.get(DISCORD_SUMMARY_URL, timeout=10)
        end_time = time.time()
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
            "region_services": region_services,
            "announcements": custom_announcements
        }
    except Exception as e:
        return {
            "status_indicator": "error",
            "status_description": f"Erreur : {str(e)}",
            "latency_ms": 0,
            "api_services": [],
            "region_services": [],
            "announcements": custom_announcements
        }

@app.get("/api/discord-incidents")
def get_discord_incidents():
    try:
        res = requests.get(DISCORD_INCIDENTS_URL, timeout=10)
        data = res.json()
        incidents = data.get("incidents", [])
        return {"incidents": incidents[:15]} # Les 15 derniers incidents
    except Exception as e:
        return {"incidents": [], "error": str(e)}

# Routes d'administration pour les messages d'annonce
@app.post("/api/announcements")
def add_announcement(item: AnnouncementItem):
    new_id = len(custom_announcements) + 1
    new_announcement = {"id": new_id, "text": item.text, "type": item.type}
    custom_announcements.append(new_announcement)
    return {"status": "ok", "announcement": new_announcement}

@app.delete("/api/announcements/{announcement_id}")
def delete_announcement(announcement_id: int):
    global custom_announcements
    custom_announcements = [a for a in custom_announcements if a.get("id") != announcement_id]
    return {"status": "deleted"}
