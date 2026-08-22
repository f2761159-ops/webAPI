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

// Base de données en mémoire
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
    servicesStatus: [],
    discordStatusSummary: "Chargement des données officielles..."
};

// Fonction de vérification réelle et officielle
async function checkRealServices() {
    let results = [];

    // 1. Test réel de votre API Rescue Horizon
    const startApi = Date.now();
    try {
        await axios.get("https://webapi-jlzq.onrender.com", { timeout: 5000 });
        results.push({ name: "API Backend Rescue Horizon", status: "up", ping: Date.now() - startApi });
    } catch (e) {
        results.push({ name: "API Backend Rescue Horizon", status: "down", ping: 0 });
    }

    // 2. Récupération du VRAI statut officiel de Discord (via leur API publique Statuspage)
    try {
        const discordRes = await axios.get("https://status.discord.com/api/v2/summary.json", { timeout: 5000 });
        
        // On récupère le résumé textuel officiel de Discord
        database.discordStatusSummary = discordRes.data.status.description;

        // On ajoute les composants clés de Discord de manière officielle
        discordRes.data.components.forEach(comp => {
            // Traduction / Adaptation simple des états Discord (operational, degraded_performance, partial_outage, major_outage)
            let isUp = comp.status === "operational";
            results.push({
                name: `Discord - ${comp.name}`,
                status: isUp ? "up" : "down",
                ping: isUp ? 35 : 0 // Valeur indicative stable pour un service tiers
            });
        });
    } catch (e) {
        results.push({ name: "API Status Discord", status: "down", ping: 0 });
        database.discordStatusSummary = "Impossible de joindre le statut officiel de Discord";
    }

    database.servicesStatus = results;

    // Diffusion en temps réel à tous les clients connectés
    io.emit('realStatusUpdate', {
        services: database.servicesStatus,
        discordSummary: database.discordStatusSummary
    });
}

// Lancer le check réel toutes les 15 secondes (pour ne pas saturer les requêtes)
setInterval(checkRealServices, 15000);

// Gestion des WebSockets
io.on('connection', (socket) => {
    console.log('Utilisateur connecté :', socket.id);

    // Envoyer les données initiales
    socket.emit('loadInitialData', database);
    socket.emit('realStatusUpdate', {
        services: database.servicesStatus,
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
    console.log(`Serveur réel actif sur le port ${PORT}`);
    checkRealServices();
});
