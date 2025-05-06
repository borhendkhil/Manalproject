const express = require('express');
const router = express.Router();

// Exemple : Retourner une vitesse pour N1
router.get('/vitesse', (req, res) => {
  res.json({ niveau: 'N1', valeur: 1450 }); // Simulé pour test
});

module.exports = router;



