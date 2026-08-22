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

// --- BASE DE DONNÉES EN MÉMOIRE ---
let database = {
    announcement: {
        text: "Bienvenue sur le tableau de bord de Rescue Horizon.",
        date: new Date().toLocaleString("fr-FR")
    },
    credits: {
        creditsText: "Créateur & Développeur Principal | Vous\nTests & Retours Utilisateur | La Communauté",
        pubTitle: "🚨 RESCUE HORIZON – JEU ROLEPLAY ROBLOX",
        pubContent: "Tu cherches un jeu RP sérieux, actif et réaliste ? Bienvenue sur Rescue Horizon.",
        pubLink: "https://discord.gg/Jdba4YvEAG"
    },
    pseudos: [],
    servicesStatus: []
};

// --- MONITORING AUTOMATIQUE (Toutes les 10s) ---
const servicesToWatch = [
    { name: "API Rescue Horizon", url: "https://webapi-jlzq.onrender.com" }
];

async function checkServices() {
    let results = [];
    for (let service of servicesToWatch) {
        try {
            const start = Date.now();
            await axios.get(service.url, { timeout: 5000 });
            results.push({ name: service.name, status: "up", ping: Date.now() - start });
        } catch (e) {
            results.push({ name: service.name, status: "down", ping: 0 });
        }
    }
    database.servicesStatus = results;
    // Envoie l'info de statut à TOUS les utilisateurs connectés
    io.emit('statusUpdate', results);
}

// Lancer le monitoring toutes les 10 secondes
setInterval(checkServices, 10000);

// --- GESTION SOCKETS ---
io.on('connection', (socket) => {
    console.log('Utilisateur connecté :', socket.id);

    // Envoi des données initiales au nouveau connecté
    socket.emit('loadInitialData', database);
    socket.emit('statusUpdate', database.servicesStatus);

    // Enregistrement pseudo
    socket.on('userLogin', (userData) => {
        database.pseudos.unshift({
            pseudo: userData.pseudo,
            date: new Date().toLocaleString("fr-FR"),
            role: userData.role === "admin" ? "Administrateur" : "Membre"
        });
        if (database.pseudos.length > 50) database.pseudos.pop();
        io.emit('updatePseudosList', database.pseudos);
    });

    // Sauvegarde annonce
    socket.on('saveAnnouncement', (data) => {
        database.announcement = { text: data.text, date: new Date().toLocaleString("fr-FR") };
        io.emit('updateAnnounceBroadcast', database.announcement);
    });

    // Sauvegarde crédits
    socket.on('saveCredits', (data) => {
        database.credits = data;
        io.emit('updateCreditsBroadcast', database.credits);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur actif sur le port ${PORT}`);
    checkServices(); 
});
