import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import ProgressBar from 'react-bootstrap/ProgressBar';
import {
  FiEdit2,
  FiTrash2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiArrowLeft,
  FiTruck,
  FiStar,
  FiCreditCard,
  FiInfo,
  FiShoppingCart,
  FiUser,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';
import {
  useGetFournisseurQuery,
  useDeleteFournisseurMutation,
} from '../../redux/api/fournisseursApi';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

const CATEGORY_META = {
  local:         { label: 'Local',         color: '#22c55e' },
  international: { label: 'International', color: '#6366f1' },
  fabricant:     { label: 'Fabricant',     color: '#3b82f6' },
  distributeur:  { label: 'Distributeur',  color: '#f59e0b' },
  prestataire:   { label: 'Prestataire',   color: '#8b5cf6' },
  autre:         { label: 'Autre',         color: '#94a3b8' },
};

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="d-flex align-items-start py-2 border-bottom gap-3">
    {Icon && <Icon size={15} className="text-muted mt-1 flex-shrink-0" />}
    <div className="d-flex flex-column flex-md-row gap-1 gap-md-4 flex-grow-1">
      <span className="text-muted flex-shrink-0" style={{ minWidth: 160, fontSize: 13 }}>
        {label}
      </span>
      <span className="fw-medium text-dark" style={{ fontSize: 14 }}>
        {value ?? <span className="text-muted fst-italic">—</span>}
      </span>
    </div>
  </div>
);

const KpiCard = ({ label, value, sub, color = '#6366f1' }) => (
  <Card
    className="border-0 h-100 text-center"
    style={{ background: `${color}0d`, borderTop: `3px solid ${color}`, borderRadius: 10 }}
  >
    <Card.Body className="py-3">
      <div className="fw-bold" style={{ fontSize: 20, color }}>{value}</div>
      {sub && <div className="text-muted small">{sub}</div>}
      <div className="text-muted mt-1" style={{ fontSize: 12 }}>{label}</div>
    </Card.Body>
  </Card>
);

const RatingBar = ({ label, value }) => {
  const pct = ((value - 1) / 4) * 100;
  const variant = pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger';
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between mb-1">
        <small className="text-muted">{label}</small>
        <small className="fw-semibold">
          {'★'.repeat(Math.round(value))}
          <span style={{ color: '#e2e8f0' }}>{'★'.repeat(5 - Math.round(value))}</span>
          {' '}{value}/5
        </small>
      </div>
      <ProgressBar now={pct} variant={variant} style={{ height: 8, borderRadius: 4 }} />
    </div>
  );
};

/* ─── composant principal ─────────────────────────────────────────────────── */
const FournisseurDetailPage = () => {
  const { id }          = useParams();
  const navigate        = useNavigate();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('informations');

  const { data: fournisseurData, isLoading, error } = useGetFournisseurQuery(id);
  const [deleteFournisseur, { isLoading: isDeleting }] = useDeleteFournisseurMutation();

  const fournisseur = fournisseurData?.data;

  usePageTitle(
    fournisseur ? fournisseur.raisonSociale : 'Detail Fournisseur',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Fournisseurs', path: '/fournisseurs' },
      { label: 'Detail' },
    ]
  );

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        Erreur : {error.data?.message || 'Impossible de charger ce fournisseur'}
      </Alert>
    );
  }

  if (!fournisseur) {
    return <Alert variant="warning">Fournisseur introuvable</Alert>;
  }

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer le fournisseur "${fournisseur.raisonSociale}" ?`)) return;
    try {
      await deleteFournisseur(id).unwrap();
      toast.success('Fournisseur supprime avec succes');
      navigate('/fournisseurs');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la suppression');
    }
  };

  const catMeta   = CATEGORY_META[fournisseur.category] || CATEGORY_META.autre;
  const initials  = getInitials(fournisseur.raisonSociale);
  const rating    = fournisseur.rating || {};
  const ratingMoyen = fournisseur.ratingMoyen ||
    (rating.qualite ? Math.round(((rating.qualite + rating.delai + rating.prix + rating.service) / 4) * 10) / 10 : 0);
  const hasBankInfo = fournisseur.bankInfo?.bankName || fournisseur.bankInfo?.accountNumber;

  return (
    <>
      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <Button
          variant="link"
          className="p-0 text-muted text-decoration-none d-flex align-items-center gap-1"
          onClick={() => navigate('/fournisseurs')}
        >
          <FiArrowLeft size={16} />
          <span style={{ fontSize: 14 }}>Retour aux fournisseurs</span>
        </Button>
      </div>

      {/* ── Hero banniere ───────────────────────────────────────────────── */}
      <Card
        className="border-0 shadow-sm mb-4"
        style={{
          borderRadius: 14,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        <Card.Body className="p-4">
          <Row className="align-items-start g-3">
            <Col xs={12} md>
              <div className="d-flex align-items-start gap-4">
                {/* Avatar */}
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 fw-bold text-white"
                  style={{
                    width: 64, height: 64, fontSize: 22,
                    background: `linear-gradient(135deg,${catMeta.color},${catMeta.color}99)`,
                  }}
                >
                  {initials}
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <Badge
                      style={{ backgroundColor: catMeta.color, fontSize: 11 }}
                    >
                      {catMeta.label}
                    </Badge>
                    <Badge
                      bg={fournisseur.isActive ? 'success' : 'danger'}
                      style={{ fontSize: 11 }}
                    >
                      {fournisseur.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                    {ratingMoyen > 0 && (
                      <span
                        className="px-2 py-1 rounded-pill"
                        style={{ background: '#f59e0b20', color: '#f59e0b', fontSize: 12, fontWeight: 600 }}
                      >
                        ★ {ratingMoyen}/5
                      </span>
                    )}
                  </div>
                  <h2 className="text-white fw-bold mb-1" style={{ fontSize: 22 }}>
                    {fournisseur.raisonSociale}
                  </h2>
                  <code className="text-secondary" style={{ fontSize: 13 }}>{fournisseur.code}</code>

                  {/* Contact rapide */}
                  <div className="d-flex flex-wrap gap-3 mt-2">
                    {fournisseur.email && (
                      <a
                        href={`mailto:${fournisseur.email}`}
                        className="text-secondary d-flex align-items-center gap-1 text-decoration-none"
                        style={{ fontSize: 13 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiMail size={13} /> {fournisseur.email}
                      </a>
                    )}
                    {fournisseur.phone && (
                      <a
                        href={`tel:${fournisseur.phone}`}
                        className="text-secondary d-flex align-items-center gap-1 text-decoration-none"
                        style={{ fontSize: 13 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiPhone size={13} /> {fournisseur.phone}
                      </a>
                    )}
                    {fournisseur.address?.city && (
                      <span className="text-secondary d-flex align-items-center gap-1" style={{ fontSize: 13 }}>
                        <FiMapPin size={13} /> {fournisseur.address.city}
                      </span>
                    )}
                    {fournisseur.website && (
                      <a
                        href={fournisseur.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-secondary d-flex align-items-center gap-1 text-decoration-none"
                        style={{ fontSize: 13 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiGlobe size={13} /> Site web
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Col>

            {/* Actions */}
            <Col xs={12} md="auto" className="d-flex gap-2 flex-wrap">
              {hasPermission(PERM.FOURNISSEURS_UPDATE) && (
                <Button
                  variant="warning"
                  onClick={() => navigate(`/fournisseurs/${id}/modifier`)}
                  className="d-flex align-items-center gap-2"
                >
                  <FiEdit2 size={15} /> Modifier
                </Button>
              )}
              {hasPermission(PERM.FOURNISSEURS_DELETE) && (
                <Button
                  variant="outline-danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="d-flex align-items-center gap-2"
                >
                  <FiTrash2 size={15} />
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── KPIs financiers ─────────────────────────────────────────────── */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={4}>
          <KpiCard
            label="Total Achats"
            value={formatMoney(fournisseur.totalAchats || 0)}
            sub="Depuis la creation"
            color="#22c55e"
          />
        </Col>
        <Col xs={6} md={4}>
          <KpiCard
            label="Dettes en cours"
            value={formatMoney(fournisseur.totalDettes || 0)}
            sub="A payer"
            color={(fournisseur.totalDettes || 0) > 0 ? '#ef4444' : '#94a3b8'}
          />
        </Col>
        <Col xs={6} md={4}>
          <KpiCard
            label="Commandes"
            value={fournisseur.nombreCommandes || 0}
            sub="Toutes periodes"
            color="#6366f1"
          />
        </Col>
      </Row>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Card className="border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <Card.Header className="bg-white border-bottom" style={{ borderRadius: '12px 12px 0 0' }}>
            <Nav variant="tabs" className="border-0">
              <Nav.Item>
                <Nav.Link eventKey="informations" className="d-flex align-items-center gap-2">
                  <FiInfo size={14} /> Informations
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="commercial" className="d-flex align-items-center gap-2">
                  <FiTruck size={14} /> Conditions d'achat
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="evaluation" className="d-flex align-items-center gap-2">
                  <FiStar size={14} /> Evaluation
                </Nav.Link>
              </Nav.Item>
              {hasBankInfo && (
                <Nav.Item>
                  <Nav.Link eventKey="banque" className="d-flex align-items-center gap-2">
                    <FiCreditCard size={14} /> Banque
                  </Nav.Link>
                </Nav.Item>
              )}
              <Nav.Item>
                <Nav.Link eventKey="achats" className="d-flex align-items-center gap-2">
                  <FiShoppingCart size={14} /> Historique achats
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>

          <Card.Body className="p-4">
            <Tab.Content>

              {/* ── Onglet Informations ──────────────────────────────── */}
              <Tab.Pane eventKey="informations">
                <Row className="g-4">
                  <Col md={6}>
                    <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Identification
                    </h6>
                    <InfoRow label="Raison Sociale" value={fournisseur.raisonSociale} icon={FiTruck} />
                    <InfoRow label="Code fournisseur" value={fournisseur.code} />
                    <InfoRow label="NINEA" value={fournisseur.ninea} />
                    <InfoRow label="RCCM" value={fournisseur.rccm} />
                    <InfoRow label="Categorie" value={catMeta.label} />
                    <InfoRow label="Devise" value={fournisseur.devises || 'XOF'} />
                    <InfoRow label="Statut" value={
                      <Badge bg={fournisseur.isActive ? 'success' : 'secondary'}>
                        {fournisseur.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    } />
                  </Col>

                  <Col md={6}>
                    <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Contact
                    </h6>
                    <InfoRow label="Email" value={fournisseur.email} icon={FiMail} />
                    <InfoRow label="Telephone" value={fournisseur.phone} icon={FiPhone} />
                    {fournisseur.mobile && (
                      <InfoRow label="Mobile" value={fournisseur.mobile} icon={FiPhone} />
                    )}
                    {fournisseur.fax && (
                      <InfoRow label="Fax" value={fournisseur.fax} />
                    )}
                    {fournisseur.website && (
                      <InfoRow label="Site web" value={
                        <a href={fournisseur.website} target="_blank" rel="noreferrer" className="text-primary">
                          {fournisseur.website}
                        </a>
                      } icon={FiGlobe} />
                    )}

                    <h6 className="text-uppercase text-muted fw-semibold mb-3 mt-4" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Adresse
                    </h6>
                    {fournisseur.address?.street && (
                      <InfoRow label="Rue" value={fournisseur.address.street} icon={FiMapPin} />
                    )}
                    <InfoRow label="Ville" value={fournisseur.address?.city} icon={FiMapPin} />
                    {fournisseur.address?.region && (
                      <InfoRow label="Region" value={fournisseur.address.region} />
                    )}
                    <InfoRow label="Pays" value={fournisseur.address?.country || 'Senegal'} />
                  </Col>

                  {/* Personne de contact */}
                  {fournisseur.contactPerson?.name && (
                    <Col md={12}>
                      <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                        Personne de contact
                      </h6>
                      <Row>
                        <Col md={3}><InfoRow label="Nom" value={fournisseur.contactPerson.name} icon={FiUser} /></Col>
                        <Col md={3}><InfoRow label="Poste" value={fournisseur.contactPerson.position} /></Col>
                        <Col md={3}><InfoRow label="Telephone" value={fournisseur.contactPerson.phone} icon={FiPhone} /></Col>
                        <Col md={3}><InfoRow label="Email" value={fournisseur.contactPerson.email} icon={FiMail} /></Col>
                      </Row>
                    </Col>
                  )}

                  {/* Notes */}
                  {fournisseur.notes && (
                    <Col md={12}>
                      <h6 className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: 11, letterSpacing: 1 }}>
                        Notes
                      </h6>
                      <div
                        className="p-3 rounded-3 text-muted"
                        style={{ background: '#f8faff', border: '1px dashed #cbd5e1', fontSize: 14, whiteSpace: 'pre-wrap' }}
                      >
                        {fournisseur.notes}
                      </div>
                    </Col>
                  )}

                  {/* Systeme */}
                  <Col md={12}>
                    <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Informations systeme
                    </h6>
                    <Row>
                      <Col md={4}><InfoRow label="Cree le" value={formatDate(fournisseur.createdAt)} /></Col>
                      <Col md={4}><InfoRow label="Modifie le" value={formatDate(fournisseur.updatedAt)} /></Col>
                    </Row>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* ── Onglet Conditions d'achat ─────────────────────── */}
              <Tab.Pane eventKey="commercial">
                <Row className="g-4">
                  <Col md={6}>
                    <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Conditions commerciales
                    </h6>
                    <InfoRow
                      label="Delai de paiement"
                      value={`${fournisseur.delaiPaiement || 30} jours`}
                      icon={FiCreditCard}
                    />
                    <InfoRow
                      label="Delai de livraison"
                      value={`${fournisseur.delaiLivraison || 7} jours`}
                      icon={FiTruck}
                    />
                    <InfoRow
                      label="Conditions de paiement"
                      value={fournisseur.conditionsPaiement}
                    />
                    <InfoRow
                      label="Devise"
                      value={fournisseur.devises || 'XOF (FCFA)'}
                    />
                  </Col>
                  <Col md={6}>
                    <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Resume financier
                    </h6>
                    <div
                      className="p-4 rounded-3"
                      style={{ background: '#f8faff', border: '1px solid #e0e7ff' }}
                    >
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Total achats cumules</span>
                        <span className="fw-bold text-success">{formatMoney(fournisseur.totalAchats || 0)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Dettes restantes</span>
                        <span className="fw-bold text-danger">{formatMoney(fournisseur.totalDettes || 0)}</span>
                      </div>
                      <div className="d-flex justify-content-between border-top pt-2 mt-2">
                        <span className="text-muted small">Nombre de commandes</span>
                        <span className="fw-bold text-primary">{fournisseur.nombreCommandes || 0}</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* ── Onglet Evaluation ────────────────────────────────── */}
              <Tab.Pane eventKey="evaluation">
                <Row className="g-4">
                  <Col md={6}>
                    <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Notes par critere
                    </h6>
                    <RatingBar label="Qualite des produits / services" value={rating.qualite || 3} />
                    <RatingBar label="Respect des delais de livraison" value={rating.delai || 3} />
                    <RatingBar label="Niveau des prix" value={rating.prix || 3} />
                    <RatingBar label="Qualite du service client" value={rating.service || 3} />
                  </Col>
                  <Col md={6}>
                    <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Note globale
                    </h6>
                    <div
                      className="p-4 rounded-3 text-center"
                      style={{ background: '#fffbeb', border: '2px solid #f59e0b' }}
                    >
                      <div style={{ fontSize: 56, color: '#f59e0b', lineHeight: 1 }}>
                        {ratingMoyen > 0 ? ratingMoyen : '—'}
                      </div>
                      <div style={{ fontSize: 24, color: '#f59e0b', marginTop: 4 }}>
                        {'★'.repeat(Math.round(ratingMoyen))}
                        <span style={{ color: '#e2e8f0' }}>
                          {'★'.repeat(5 - Math.round(ratingMoyen))}
                        </span>
                      </div>
                      <div className="text-muted mt-2 small">Note moyenne sur 5</div>
                    </div>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* ── Onglet Banque ────────────────────────────────────── */}
              {hasBankInfo && (
                <Tab.Pane eventKey="banque">
                  <Row className="g-3">
                    <Col md={6}>
                      <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                        Informations bancaires
                      </h6>
                      <InfoRow label="Banque" value={fournisseur.bankInfo?.bankName} icon={FiCreditCard} />
                      <InfoRow label="N° de compte" value={fournisseur.bankInfo?.accountNumber} />
                      <InfoRow label="IBAN" value={fournisseur.bankInfo?.iban} />
                      <InfoRow label="SWIFT / BIC" value={fournisseur.bankInfo?.swift} />
                    </Col>
                  </Row>
                </Tab.Pane>
              )}

              {/* ── Onglet Historique achats ─────────────────────────── */}
              <Tab.Pane eventKey="achats">
                <div className="text-center py-5">
                  <FiShoppingCart size={40} className="text-muted mb-3" />
                  <p className="text-muted">
                    L'historique des commandes fournisseur sera affiche ici.
                  </p>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => navigate('/achats/commandes')}
                  >
                    Voir les commandes fournisseurs
                  </Button>
                </div>
              </Tab.Pane>

            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>
    </>
  );
};

export default FournisseurDetailPage;
