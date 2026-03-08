#!/bin/bash
# =============================================================================
# Génération d'un certificat SSL auto-signé pour le développement local.
# NE PAS utiliser en production — utiliser Let's Encrypt (voir letsencrypt.sh).
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_FILE="$SCRIPT_DIR/cert.pem"
KEY_FILE="$SCRIPT_DIR/key.pem"
DAYS=365

echo "=================================================="
echo "  Génération du certificat SSL auto-signé (dev)"
echo "=================================================="

# Vérifier qu'openssl est disponible
if ! command -v openssl &> /dev/null; then
    echo "❌  openssl n'est pas installé. Installez-le et relancez ce script."
    exit 1
fi

# Générer la clé privée RSA 4096 bits + le certificat auto-signé en une commande
openssl req -x509 \
    -newkey rsa:4096 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -days "$DAYS" \
    -nodes \
    -subj "/C=SN/ST=Dakar/L=Dakar/O=ERP Senegal Dev/OU=IT/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1"

chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo ""
echo "✅  Certificat généré avec succès :"
echo "    Certificat : $CERT_FILE"
echo "    Clé privée : $KEY_FILE"
echo "    Validité   : $DAYS jours"
echo ""
echo "⚠️  Ce certificat est auto-signé. Le navigateur affichera un avertissement."
echo "    Acceptez l'exception de sécurité ou importez cert.pem dans votre"
echo "    magasin de certificats (Keychain / certutil / mmc)."
echo ""
echo "    Pour démarrer l'application :"
echo "    docker compose up --build"
