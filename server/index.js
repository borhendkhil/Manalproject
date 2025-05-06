const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Charger le fichier .env

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Pour lire le JSON dans les requêtes

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log(' Connecté à MongoDB Atlas'))
.catch((err) => console.error('Erreur MongoDB:', err));

// Schéma et modèle pour les données de la machine
const machineSchema = new mongoose.Schema({
  temperature1: Number,
  temperature2: Number,
  temperature3: Number,
  temperature4: Number,
  door1Open: Boolean,
  door2Open: Boolean,
  relayState: Boolean,
  timestamp: { type: Date, default: Date.now }
});

const MachineStatus = mongoose.model('MachineStatus', machineSchema);

// Route pour recevoir les données
app.post('/api/machine-status', async (req, res) => {
  try {
    const {
      temperature1,
      temperature2,
      temperature3,
      temperature4,
      door1Open,
      door2Open,
      relayState,
    } = req.body;

    const newStatus = new MachineStatus({
      temperature1,
      temperature2,
      temperature3,
      temperature4,
      door1Open,
      door2Open,
      relayState,
    });

    await newStatus.save();

    res.status(201).json({ message: ' Données enregistrées avec succès !' });
  } catch (error) {
    console.error('Erreur en sauvegardant:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Serveur en marche sur le port ${PORT}`);
});
