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

@app.get("/api/discord-status")
def get_discord_status():
    try:
        response = requests.get("https://discordstatus.com/api/v2/summary.json", timeout=5)
        return response.json()
    except Exception as e:
        return {"error": str(e)}
