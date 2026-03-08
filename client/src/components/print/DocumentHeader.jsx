import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';

/**
 * En-tête document commun aux pages détail (facture, devis, commande, bon livraison…).
 * Affiche deux Cards côte à côte : informations du document (lg=8) + tiers (lg=4).
 *
 * @param {string}   props.docLabel          - Titre de la card info, ex: "Informations de la facture"
 * @param {string}   props.numero            - Numéro du document
 * @param {string}   props.statut            - Statut actuel
 * @param {Object}   props.statusColors      - { statut: variant Bootstrap }
 * @param {Object}   props.statusLabels      - { statut: libellé affiché }
 * @param {Array}    props.dateFields        - [{ label, value }] dates déjà formatées par l'appelant
 * @param {string}   [props.conditionsPaiement]
 * @param {string}   [props.notes]
 * @param {string}   [props.tiersLabel]      - "Client" | "Fournisseur" (défaut: "Client")
 * @param {Object}   [props.tiers]           - { nom, email, phone, adresse?, ninea?, rccm? }
 *                                             L'appelant normalise depuis snapshot ou document live.
 *
 * Exemple d'usage :
 *   const tiers = facture.clientSnapshot
 *     ? { nom: facture.clientSnapshot.displayName, email: facture.clientSnapshot.email, phone: facture.clientSnapshot.phone }
 *     : facture.client
 *     ? { nom: facture.client.displayName || facture.client.nom, email: facture.client.email }
 *     : null;
 *
 *   <DocumentHeader
 *     docLabel="Informations de la facture"
 *     numero={facture.numero}
 *     statut={facture.statut}
 *     statusColors={statusColors}
 *     statusLabels={statusLabels}
 *     dateFields={[
 *       { label: 'Date', value: formatDate(facture.dateFacture) },
 *       { label: "Date d'echeance", value: formatDate(facture.dateEcheance) },
 *     ]}
 *     conditionsPaiement={facture.conditionsPaiement}
 *     notes={facture.notes}
 *     tiersLabel="Client"
 *     tiers={tiers}
 *   />
 */
const DocumentHeader = ({
  docLabel = 'Informations',
  numero,
  statut,
  statusColors = {},
  statusLabels = {},
  dateFields = [],
  conditionsPaiement,
  notes,
  tiersLabel = 'Client',
  tiers,
}) => (
  <Row className="g-3 mb-4">
    {/* Card informations document */}
    <Col lg={8}>
      <Card className="shadow-sm h-100">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">{docLabel}</h6>
            <Badge bg={statusColors[statut] || 'secondary'}>
              {statusLabels[statut] || statut}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              {numero && (
                <p className="mb-2">
                  <strong>Numero :</strong> {numero}
                </p>
              )}
              {dateFields.map(({ label, value }) =>
                value ? (
                  <p key={label} className="mb-2">
                    <strong>{label} :</strong> {value}
                  </p>
                ) : null
              )}
            </Col>
            {conditionsPaiement && (
              <Col md={6}>
                <p className="mb-2">
                  <strong>Conditions de paiement :</strong>
                  <br />
                  {conditionsPaiement}
                </p>
              </Col>
            )}
          </Row>
          {notes && (
            <div className="mt-2">
              <strong>Notes :</strong>
              <p className="text-muted mb-0">{notes}</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>

    {/* Card tiers (client ou fournisseur) */}
    <Col lg={4}>
      <Card className="shadow-sm h-100">
        <Card.Header className="bg-white">
          <h6 className="mb-0">{tiersLabel}</h6>
        </Card.Header>
        <Card.Body>
          {tiers ? (
            <>
              {tiers.nom && <h6 className="mb-2">{tiers.nom}</h6>}
              {tiers.email && (
                <p className="mb-1 small text-muted">
                  <strong>Email :</strong> {tiers.email}
                </p>
              )}
              {tiers.phone && (
                <p className="mb-1 small text-muted">
                  <strong>Tel :</strong> {tiers.phone}
                </p>
              )}
              {tiers.adresse && (
                <p className="mb-1 small text-muted">
                  <strong>Adresse :</strong> {tiers.adresse}
                </p>
              )}
              {tiers.ninea && (
                <p className="mb-1 small text-muted">
                  <strong>NINEA :</strong> {tiers.ninea}
                </p>
              )}
              {tiers.rccm && (
                <p className="mb-1 small text-muted">
                  <strong>RCCM :</strong> {tiers.rccm}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted mb-0">Aucun {tiersLabel.toLowerCase()} associe</p>
          )}
        </Card.Body>
      </Card>
    </Col>
  </Row>
);

export default DocumentHeader;
