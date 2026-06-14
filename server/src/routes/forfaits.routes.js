const express = require('express');
const router = express.Router();
const { listForfaits, getForfait } = require('../controllers/forfaitController');

// Routes publiques — accessibles depuis la page d'inscription
router.get('/', listForfaits);
router.get('/:code', getForfait);

module.exports = router;
