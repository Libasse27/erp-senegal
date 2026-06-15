const mongoose = require('mongoose');

/**
 * PlatformSetting — Paramètres globaux de la plateforme SaaS.
 * Un seul document (singleton). Administrable par le Super Admin sans redéploiement.
 */
const platformSettingSchema = new mongoose.Schema(
  {
    // Clé unique pour garantir le singleton
    _singleton: { type: String, default: 'PLATFORM', unique: true },

    // ── Emails ────────────────────────────────────────────────────────────────
    email: {
      fromName:    { type: String, default: 'ERP GesCom SaaS' },
      fromAddress: { type: String, default: 'noreply@gescom.sn' },
      supportEmail:{ type: String, default: 'support@gescom.sn' },
    },

    // ── Passerelles de paiement actives ───────────────────────────────────────
    // Activables sans redéploiement — les providers inactifs sont ignorés
    paiement: {
      wave: {
        actif:   { type: Boolean, default: true },
        sandbox: { type: Boolean, default: true },
      },
      orangeMoney: {
        actif:   { type: Boolean, default: true },
        sandbox: { type: Boolean, default: true },
      },
      stripe: {
        actif:   { type: Boolean, default: false },
        sandbox: { type: Boolean, default: true },
      },
    },

    // ── Cycle de vie abonnement ───────────────────────────────────────────────
    abonnement: {
      // Jours de grâce après expiration avant suspension
      joursGrace:       { type: Number, default: 7 },
      // Jours avant expiration pour envoyer la première relance
      premierRappelJours:{ type: Number, default: 14 },
      // Jours avant expiration pour envoyer la deuxième relance
      deuxiemeRappelJours:{ type: Number, default: 3 },
    },

    // ── Sécurité ──────────────────────────────────────────────────────────────
    securite: {
      // Tentatives de connexion avant verrouillage
      maxTentativesConnexion: { type: Number, default: 5 },
      // Durée de verrouillage en minutes
      dureeVerrouillageMin:   { type: Number, default: 30 },
    },

    // ── Stockage ──────────────────────────────────────────────────────────────
    stockage: {
      maxFileSizeMo:     { type: Number, default: 5 },
      typesAutorises:    { type: [String], default: ['image/jpeg', 'image/png', 'application/pdf'] },
    },

    // ── Feature flags globaux ─────────────────────────────────────────────────
    features: {
      registrationPublique: { type: Boolean, default: true },
      mfaDisponible:        { type: Boolean, default: true },
      essaiGratuitActif:    { type: Boolean, default: true },
    },

    // ── Branding ─────────────────────────────────────────────────────────────
    branding: {
      nomPlateforme: { type: String, default: 'ERP GesCom SaaS' },
      logoUrl:       { type: String, default: null },
      couleurPrimaire:{ type: String, default: '#1a56db' },
      siteweb:       { type: String, default: 'https://gescom.sn' },
    },

    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Retourne le singleton (en crée un si absent)
platformSettingSchema.statics.getInstance = async function () {
  let settings = await this.findOne({ _singleton: 'PLATFORM' });
  if (!settings) {
    settings = await this.create({ _singleton: 'PLATFORM' });
  }
  return settings;
};

module.exports = mongoose.model('PlatformSetting', platformSettingSchema);
