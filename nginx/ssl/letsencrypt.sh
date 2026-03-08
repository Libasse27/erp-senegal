#!/bin/bash
# =============================================================================
# Obtention et renouvellement d'un certificat Let's Encrypt (production).
# Prérequis :
#   - Le domaine pointe vers ce serveur (DNS configuré)
#   - Le port 80 est accessible depuis Internet
#   - Docker est installé
# =============================================================================

set -e

# ---- Configuration — à adapter ----
DOMAIN="${DOMAIN:-erp.example.com}"
EMAIL="${CERTBOT_EMAIL:-admin@example.com}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBROOT="/var/www/certbot"
# -----------------------------------

echo "=================================================="
echo "  Let's Encrypt — Certificat pour : $DOMAIN"
echo "=================================================="

if ! command -v docker &> /dev/null; then
    echo "❌  Docker n'est pas installé."
    exit 1
fi

echo ""
echo "1️⃣  Obtention du certificat via Certbot (Docker)..."
docker run --rm \
    -v "$SCRIPT_DIR/../../nginx/ssl:/etc/letsencrypt/live/$DOMAIN" \
    -v "$WEBROOT:/var/www/certbot" \
    certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d "$DOMAIN"

echo ""
echo "2️⃣  Copie des fichiers vers nginx/ssl/..."
# Let's Encrypt génère fullchain.pem et privkey.pem
# On les renomme en cert.pem et key.pem attendus par nginx.conf
CERT_SRC="/etc/letsencrypt/live/$DOMAIN"
cp "$CERT_SRC/fullchain.pem" "$SCRIPT_DIR/cert.pem"
cp "$CERT_SRC/privkey.pem"   "$SCRIPT_DIR/key.pem"
chmod 600 "$SCRIPT_DIR/key.pem"
chmod 644 "$SCRIPT_DIR/cert.pem"

echo ""
echo "3️⃣  Rechargement de la configuration Nginx..."
docker exec erp_nginx nginx -s reload

echo ""
echo "✅  Certificat Let's Encrypt installé avec succès pour : $DOMAIN"
echo "    Expiration dans 90 jours — pensez à planifier le renouvellement :"
echo ""
echo "    # Ajouter au cron (renouvellement automatique tous les 60 jours) :"
echo "    0 3 */60 * * /chemin/vers/nginx/ssl/letsencrypt.sh >> /var/log/certbot.log 2>&1"
