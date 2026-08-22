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
    servicesStatus: []
};

// --- LISTE DES VRAIS SERVICES À SURVEILLER ---
// (Modifiez ou ajoutez de vraies URL ici selon vos besoins)
const servicesToWatch = [
    { name: "API Backend Rescue Horizon", url: "https://webapi-jlzq.onrender.com" },
    { name: "Google (Test Réseau Global)", url: "https://www.google.com" },
    { name: "Cloudflare (DNS & Edge)", url: "https://www.cloudflare.com" }
];

// Fonction pour effectuer de vraies requêtes et mesurer la latence réelle
async function checkServices() {
    let results = [];
    for (let service of servicesToWatch) {
        const start = Date.now();
        try {
            // Requête HTTP réelle avec un timeout de 5 secondes
            await axios.get(service.url, { timeout: 5000 });
            const ping = Date.now() - start; // Calcul du vrai ping en ms
            results.push({ name: service.name, status: "up", ping: ping });
        } catch (e) {
            // Si le site ne répond pas ou crash
            results.push({ name: service.name, status: "down", ping: 0 });
        }
    }
    database.servicesStatus = results;
    
    // Diffusion en temps réel à TOUTES les personnes connectées sur le site
    io.emit('statusUpdate', results);
}

// Lancer la vraie vérification toutes les 10 secondes
setInterval(checkServices, 10000);

// --- GESTION DES WEBSOCKETS ---
io.on('connection', (socket) => {
    console.log('Nouvel utilisateur connecté :', socket.id);

    // Envoyer l'état actuel dès la connexion
    socket.emit('loadInitialData', database);
    socket.emit('statusUpdate', database.servicesStatus);

    // Enregistrement d'un pseudo
    socket.on('userLogin', (userData) => {
        database.pseudos.unshift({
            pseudo: userData.pseudo,
            date: new Date().toLocaleString("fr-FR"),
            role: userData.role === "admin" ? "Administrateur" : "Membre"
        });
        if (database.pseudos.length > 50) database.pseudos.pop();
        io.emit('updatePseudosList', database.pseudos);
    });

    // Modification admin des annonces
    socket.on('saveAnnouncement', (data) => {
        database.announcement = { text: data.text, date: new Date().toLocaleString("fr-FR") };
        io.emit('updateAnnounceBroadcast', database.announcement);
    });

    // Modification admin des crédits
    socket.on('saveCredits', (data) => {
        database.credits = data;
        io.emit('updateCreditsBroadcast', database.credits);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur de surveillance 100% réel actif sur le port ${PORT}`);
    checkServices(); // Premier test immédiat au lancement
});
