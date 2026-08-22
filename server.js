const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// "Base de données" temporaire sur le serveur (sauvegardée en mémoire vive)
let database = {
    announcement: {
        text: "Bienvenue sur le tableau de bord de Rescue Horizon en temps réel.",
        date: new Date().toLocaleString("fr-FR")
    },
    credits: {
        creditsText: "Créateur & Développeur Principal | Vous\nTests & Retours Utilisateur | La Communauté",
        pubTitle: "🚨 RESCUE HORIZON – JEU ROLEPLAY ROBLOX",
        pubContent: "Tu cherches un jeu RP sérieux, actif et réaliste ? Bienvenue sur Rescue Horizon.",
        pubLink: "https://discord.gg/Jdba4YvEAG"
    },
    pseudos: []
};

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté :', socket.id);

    // Envoyer l'état actuel de la base de données dès la connexion
    socket.emit('loadInitialData', database);

    // Enregistrement d'un pseudo lors de la connexion au site
    socket.on('userLogin', (userData) => {
        database.pseudos.unshift({
            pseudo: userData.pseudo,
            date: new Date().toLocaleString("fr-FR"),
            role: userData.role === "admin" ? "Administrateur" : "Membre"
        });
        if (database.pseudos.length > 50) database.pseudos.pop();

        // Diffuser la nouvelle liste des pseudos à tout le monde
        io.emit('updatePseudosList', database.pseudos);
    });

    // Modification de l'annonce par l'admin
    socket.on('saveAnnouncement', (data) => {
        database.announcement = {
            text: data.text,
            date: new Date().toLocaleString("fr-FR")
        };
        // Propager à TOUS les utilisateurs connectés instantanément
        io.emit('updateAnnounceBroadcast', database.announcement);
    });

    // Modification des crédits/pub par l'admin
    socket.on('saveCredits', (data) => {
        database.credits = data;
        // Propager à TOUS les utilisateurs connectés instantanément
        io.emit('updateCreditsBroadcast', database.credits);
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur WebSocket & API actif sur le port ${PORT}`);
});