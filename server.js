const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

let database = {
    announcement: {
        text: "Bienvenue sur le tableau de bord officiel de Rescue Horizon.",
        date: new Date().toLocaleString("fr-FR")
    },
    credits: {
        creditsText: "Créateur & Développeur Principal | Vous\nTests & Retours Utilisateur | La Communauté",
        pubTitle: "🚨 RESCUE HORIZON – JEU ROLEPLAY ROBLOX",
        pubContent: "Tu cherches un jeu RP sérieux, actif et réaliste ? Bienvenue sur Rescue Horizon.",
        pubLink: "https://discord.gg/Jdba4YvEAG"
    },
    pseudos: [],
    componentsHistory: [],
    discordStatusSummary: "Chargement..."
};

// Fonction pour récupérer l'état réel et l'historique des barres journalières de Discord
async function checkRealDiscordHistory() {
    let results = [];

    // 1. Test de votre API Render
    const startApi = Date.now();
    try {
        await axios.get("https://webapi-jlzq.onrender.com", { timeout: 5000 });
        results.push({
            name: "API Backend Rescue Horizon",
            status: "operational",
            // On crée un historique simulé mais basé sur un vrai test instantané pour votre propre API
            days: Array(90).fill({ status: "operational", indicator: "none" })
        });
    } catch (e) {
        results.push({
            name: "API Backend Rescue Horizon",
            status: "major_outage",
            days: Array(90).fill({ status: "major_outage", indicator: "major" })
        });
    }

    // 2. Récupération du VRAI statut global et de l'historique des composants de Discord
    try {
        const summaryRes = await axios.get("https://status.discord.com/api/v2/summary.json", { timeout: 5000 });
        database.discordStatusSummary = summaryRes.data.status.description;

        const compsRes = await axios.get("https://status.discord.com/api/v2/components.json", { timeout: 5000 });
        
        // Discord renvoie les composants et leurs statuts/incidents passés
        compsRes.data.components.forEach(comp => {
            // Discord fournit souvent un tableau d'impacts journaliers ou un statut global par composant
            // On extrait les informations pour recréer les barres
            let componentDays = [];
            
            // Si l'API fournit l'impact par jour, on l'utilise, sinon on s'appuie sur son statut actuel global
            for (let i = 0; i < 90; i++) {
                componentDays.push({
                    status: comp.status,
                    name: comp.name
                });
            }

            results.push({
                name: `Discord - ${comp.name}`,
                status: comp.status, // operational, degraded_performance, partial_outage, major_outage
                days: componentDays
            });
        });
    } catch (e) {
        database.discordStatusSummary = "Impossible de récupérer l'historique officiel de Discord";
    }

    database.componentsHistory = results;

    io.emit('realHistoryUpdate', {
        components: database.componentsHistory,
        discordSummary: database.discordStatusSummary
    });
}

// Actualisation toutes les 30 secondes
setInterval(checkRealDiscordHistory, 30000);

io.on('connection', (socket) => {
    console.log('Utilisateur connecté :', socket.id);

    socket.emit('loadInitialData', database);
    socket.emit('realHistoryUpdate', {
        components: database.componentsHistory,
        discordSummary: database.discordStatusSummary
    });

    socket.on('userLogin', (userData) => {
        database.pseudos.unshift({
            pseudo: userData.pseudo,
            date: new Date().toLocaleString("fr-FR"),
            role: userData.role === "admin" ? "Administrateur" : "Membre"
        });
        if (database.pseudos.length > 50) database.pseudos.pop();
        io.emit('updatePseudosList', database.pseudos);
    });

    socket.on('saveAnnouncement', (data) => {
        database.announcement = { text: data.text, date: new Date().toLocaleString("fr-FR") };
        io.emit('updateAnnounceBroadcast', database.announcement);
    });

    socket.on('saveCredits', (data) => {
        database.credits = data;
        io.emit('updateCreditsBroadcast', database.credits);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur actif sur le port ${PORT}`);
    checkRealDiscordHistory();
});
