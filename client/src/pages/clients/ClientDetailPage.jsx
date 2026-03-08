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
import Table from 'react-bootstrap/Table';
import {
  FiEdit2,
  FiTrash2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiArrowLeft,
  FiUser,
  FiBriefcase,
  FiFileText,
  FiCreditCard,
  FiInfo,
  FiAlertCircle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../config/permissions';
import {
  useGetClientQuery,
  useDeleteClientMutation,
  useGetClientStatsQuery,
  useGetClientFacturesQuery,
} from '../../redux/api/clientsApi';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const getDisplayName = (client) =>
  client.type === 'professionnel' && client.raisonSociale
    ? client.raisonSociale
    : [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Client sans nom';

const getInitials = (client) => {
  const name = getDisplayName(client);
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
};

const SEGMENT_META = {
  A: { color: '#22c55e', label: 'Segment A — Premium',  desc: 'Top 20% chiffre d\'affaires' },
  B: { color: '#f59e0b', label: 'Segment B — Standard', desc: 'Milieu 30% chiffre d\'affaires' },
  C: { color: '#94a3b8', label: 'Segment C — Basique',  desc: 'Base 50% chiffre d\'affaires' },
};

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="d-flex align-items-start py-2 border-bottom gap-3">
    {Icon && <Icon size={15} className="text-muted mt-1 flex-shrink-0" />}
    <div className="d-flex flex-column flex-md-row gap-1 gap-md-4 flex-grow-1">
      <span className="text-muted flex-shrink-0" style={{ minWidth: 150, fontSize: 13 }}>
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
      <div className="fw-bold" style={{ fontSize: 22, color }}>{value}</div>
      {sub && <div className="text-muted small">{sub}</div>}
      <div className="text-muted mt-1" style={{ fontSize: 12 }}>{label}</div>
    </Card.Body>
  </Card>
);

const STATUT_FACTURE_META = {
  brouillon:  { bg: 'secondary', label: 'Brouillon' },
  envoyee:    { bg: 'primary',   label: 'Envoyee' },
  payee:      { bg: 'success',   label: 'Payee' },
  partiellement_payee: { bg: 'warning', label: 'Part. payee' },
  en_retard:  { bg: 'danger',    label: 'En retard' },
  annulee:    { bg: 'dark',      label: 'Annulee' },
};

/* ─── composant principal ─────────────────────────────────────────────────── */
const ClientDetailPage = () => {
  const { id }          = useParams();
  const navigate        = useNavigate();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('informations');

  const { data: clientData, isLoading, error } = useGetClientQuery(id);
  const { data: statsData }    = useGetClientStatsQuery(id);
  const { data: facturesData } = useGetClientFacturesQuery({ id, limit: 10 });
  const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation();

  const client   = clientData?.data;
  const stats    = statsData?.data;
  const factures = facturesData?.data || [];

  usePageTitle(
    client ? getDisplayName(client) : 'Detail Client',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Clients', path: '/clients' },
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
        Erreur : {error.data?.message || 'Impossible de charger ce client'}
      </Alert>
    );
  }

  if (!client) {
    return <Alert variant="warning">Client introuvable</Alert>;
  }

  const handleDelete = async () => {
    const name = getDisplayName(client);
    if (!window.confirm(`Supprimer le client "${name}" ?`)) return;
    try {
      await deleteClient(id).unwrap();
      toast.success('Client supprime avec succes');
      navigate('/clients');
    } catch (err) {
      toast.error(err.data?.message || 'Erreur lors de la suppression');
    }
  };

  const isPro        = client.type === 'professionnel';
  const displayName  = getDisplayName(client);
  const initials     = getInitials(client);
  const segmentMeta  = SEGMENT_META[client.segment] || { color: '#94a3b8', label: 'Non classe', desc: '' };
  const avatarBg     = isPro
    ? 'linear-gradient(135deg,#6366f1,#818cf8)'
    : 'linear-gradient(135deg,#06b6d4,#22d3ee)';

  const totalCA        = stats?.totalCA       ?? client.totalCA       ?? 0;
  const totalCreances  = stats?.totalCreances ?? client.totalCreances ?? 0;
  const nbFactures     = stats?.nombreFactures ?? client.nombreFactures ?? 0;

  return (
    <>
      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <Button
          variant="link"
          className="p-0 text-muted text-decoration-none d-flex align-items-center gap-1"
          onClick={() => navigate('/clients')}
        >
          <FiArrowLeft size={16} />
          <span style={{ fontSize: 14 }}>Retour aux clients</span>
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
                  style={{ width: 64, height: 64, fontSize: 22, background: avatarBg }}
                >
                  {initials}
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <Badge
                      bg={isPro ? 'primary' : 'info'}
                      className="d-inline-flex align-items-center gap-1"
                      style={{ fontSize: 11 }}
                    >
                      {isPro ? <FiBriefcase size={10} /> : <FiUser size={10} />}
                      {isPro ? 'Professionnel' : 'Particulier'}
                    </Badge>
                    {client.segment && (
                      <Badge
                        style={{ backgroundColor: segmentMeta.color, fontSize: 11 }}
                        title={segmentMeta.desc}
                      >
                        Segment {client.segment}
                      </Badge>
                    )}
                    <Badge
                      bg={client.isActive ? 'success' : 'danger'}
                      style={{ fontSize: 11 }}
                    >
                      {client.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <h2 className="text-white fw-bold mb-1" style={{ fontSize: 22 }}>
                    {displayName}
                  </h2>
                  <code className="text-secondary" style={{ fontSize: 13 }}>{client.code}</code>

                  {/* Contact rapide */}
                  <div className="d-flex flex-wrap gap-3 mt-2">
                    {client.email && (
                      <a
                        href={`mailto:${client.email}`}
                        className="text-secondary d-flex align-items-center gap-1 text-decoration-none"
                        style={{ fontSize: 13 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiMail size={13} /> {client.email}
                      </a>
                    )}
                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="text-secondary d-flex align-items-center gap-1 text-decoration-none"
                        style={{ fontSize: 13 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiPhone size={13} /> {client.phone}
                      </a>
                    )}
                    {client.address?.city && (
                      <span className="text-secondary d-flex align-items-center gap-1" style={{ fontSize: 13 }}>
                        <FiMapPin size={13} /> {client.address.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Col>

            {/* Actions */}
            <Col xs={12} md="auto" className="d-flex gap-2 flex-wrap">
              {hasPermission(PERM.CLIENTS_UPDATE) && (
                <Button
                  variant="warning"
                  onClick={() => navigate(`/clients/${id}/modifier`)}
                  className="d-flex align-items-center gap-2"
                >
                  <FiEdit2 size={15} />
                  Modifier
                </Button>
              )}
              {hasPermission(PERM.CLIENTS_DELETE) && (
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
            label="Chiffre d'Affaires Total"
            value={formatMoney(totalCA)}
            sub="Depuis la creation"
            color="#22c55e"
          />
        </Col>
        <Col xs={6} md={4}>
          <KpiCard
            label="Creances en cours"
            value={formatMoney(totalCreances)}
            sub="A recevoir"
            color={totalCreances > 0 ? '#f59e0b' : '#94a3b8'}
          />
        </Col>
        <Col xs={6} md={4}>
          <KpiCard
            label="Nombre de Factures"
            value={nbFactures}
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
                <Nav.Link eventKey="factures" className="d-flex align-items-center gap-2">
                  <FiFileText size={14} /> Factures
                  {nbFactures > 0 && (
                    <Badge bg="primary" style={{ fontSize: 10 }}>{nbFactures}</Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="commercial" className="d-flex align-items-center gap-2">
                  <FiCreditCard size={14} /> Commercial
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
                    {isPro && (
                      <InfoRow label="Raison Sociale" value={client.raisonSociale} icon={FiBriefcase} />
                    )}
                    {!isPro && (
                      <>
                        <InfoRow label="Prenom" value={client.firstName} icon={FiUser} />
                        <InfoRow label="Nom" value={client.lastName} icon={FiUser} />
                      </>
                    )}
                    <InfoRow label="Code client" value={client.code} />
                    <InfoRow label="Type" value={isPro ? 'Professionnel' : 'Particulier'} />
                    {isPro && <InfoRow label="NINEA" value={client.ninea} />}
                    {isPro && <InfoRow label="RCCM" value={client.rccm} />}
                    <InfoRow label="Statut" value={
                      <Badge bg={client.isActive ? 'success' : 'secondary'}>
                        {client.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    } />
                  </Col>

                  <Col md={6}>
                    <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Contact
                    </h6>
                    <InfoRow label="Email" value={client.email} icon={FiMail} />
                    <InfoRow label="Telephone" value={client.phone} icon={FiPhone} />
                    {client.mobile && (
                      <InfoRow label="Mobile" value={client.mobile} icon={FiPhone} />
                    )}
                    {client.website && (
                      <InfoRow label="Site web" value={
                        <a href={client.website} target="_blank" rel="noreferrer" className="text-primary">
                          {client.website}
                        </a>
                      } icon={FiGlobe} />
                    )}

                    <h6 className="text-uppercase text-muted fw-semibold mb-3 mt-4" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Adresse
                    </h6>
                    {client.address?.street && (
                      <InfoRow label="Rue" value={client.address.street} icon={FiMapPin} />
                    )}
                    <InfoRow label="Ville" value={client.address?.city} icon={FiMapPin} />
                    {client.address?.region && (
                      <InfoRow label="Region" value={client.address.region} />
                    )}
                    {client.address?.postalCode && (
                      <InfoRow label="Code postal" value={client.address.postalCode} />
                    )}
                    <InfoRow label="Pays" value={client.address?.country || 'Senegal'} />
                  </Col>

                  {/* Contact personne pour pro */}
                  {isPro && client.contactPerson?.name && (
                    <Col md={12}>
                      <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                        Personne de contact
                      </h6>
                      <Row>
                        <Col md={3}><InfoRow label="Nom" value={client.contactPerson.name} /></Col>
                        <Col md={3}><InfoRow label="Poste" value={client.contactPerson.position} /></Col>
                        <Col md={3}><InfoRow label="Telephone" value={client.contactPerson.phone} /></Col>
                        <Col md={3}><InfoRow label="Email" value={client.contactPerson.email} /></Col>
                      </Row>
                    </Col>
                  )}

                  {/* Notes */}
                  {client.notes && (
                    <Col md={12}>
                      <h6 className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: 11, letterSpacing: 1 }}>
                        Notes
                      </h6>
                      <div
                        className="p-3 rounded-3 text-muted"
                        style={{ background: '#f8faff', border: '1px dashed #cbd5e1', fontSize: 14, whiteSpace: 'pre-wrap' }}
                      >
                        {client.notes}
                      </div>
                    </Col>
                  )}

                  {/* Systeme */}
                  <Col md={12}>
                    <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Informations systeme
                    </h6>
                    <Row>
                      <Col md={4}><InfoRow label="Cree le" value={formatDate(client.createdAt)} /></Col>
                      <Col md={4}><InfoRow label="Modifie le" value={formatDate(client.updatedAt)} /></Col>
                      <Col md={4}>
                        <InfoRow label="Segmentation" value={
                          <span style={{ color: segmentMeta.color, fontWeight: 600 }}>
                            {segmentMeta.label}
                          </span>
                        } />
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* ── Onglet Factures ──────────────────────────────────── */}
              <Tab.Pane eventKey="factures">
                {factures.length === 0 ? (
                  <div className="text-center py-5">
                    <FiFileText size={40} className="text-muted mb-3" />
                    <p className="text-muted">Aucune facture pour ce client.</p>
                    {hasPermission(PERM.FACTURES_CREATE) && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate('/ventes/factures')}
                      >
                        Voir toutes les factures
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0" style={{ fontSize: 14 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fc' }}>
                          <th className="border-0 py-3 text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>N° Facture</th>
                          <th className="border-0 py-3 text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</th>
                          <th className="border-0 py-3 text-muted fw-semibold" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Echeance</th>
                          <th className="border-0 py-3 text-muted fw-semibold text-end" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Montant TTC</th>
                          <th className="border-0 py-3 text-muted fw-semibold text-end" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Reste a payer</th>
                          <th className="border-0 py-3 text-muted fw-semibold text-center" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {factures.map((f) => {
                          const meta = STATUT_FACTURE_META[f.statut] || { bg: 'secondary', label: f.statut };
                          return (
                            <tr
                              key={f._id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/ventes/factures/${f._id}`)}
                            >
                              <td className="fw-semibold">{f.numero}</td>
                              <td className="text-muted">{formatDate(f.dateFacture)}</td>
                              <td className="text-muted">{formatDate(f.dateEcheance)}</td>
                              <td className="text-end fw-semibold">{formatMoney(f.totalTTC)}</td>
                              <td className="text-end text-warning fw-semibold">
                                {formatMoney(f.resteAPayer ?? 0)}
                              </td>
                              <td className="text-center">
                                <Badge bg={meta.bg} style={{ fontSize: 11 }}>{meta.label}</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Tab.Pane>

              {/* ── Onglet Commercial ────────────────────────────────── */}
              <Tab.Pane eventKey="commercial">
                <Row className="g-3">
                  <Col md={6}>
                    <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Conditions commerciales
                    </h6>
                    <InfoRow
                      label="Delai de paiement"
                      value={`${client.delaiPaiement || 0} jours`}
                      icon={FiCreditCard}
                    />
                    <InfoRow
                      label="Plafond credit"
                      value={formatMoney(client.plafondCredit || 0)}
                      icon={FiAlertCircle}
                    />
                    <InfoRow
                      label="Remise globale"
                      value={`${client.remiseGlobale || 0}%`}
                    />
                    <InfoRow
                      label="Mode de paiement prefere"
                      value={client.modePaiement
                        ? client.modePaiement.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                        : 'Especes'}
                    />
                  </Col>
                  <Col md={6}>
                    <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: 1 }}>
                      Segmentation ABC
                    </h6>
                    <div
                      className="p-4 rounded-3 text-center"
                      style={{
                        background: `${segmentMeta.color}15`,
                        border: `2px solid ${segmentMeta.color}`,
                      }}
                    >
                      <div className="fw-bold" style={{ fontSize: 36, color: segmentMeta.color }}>
                        {client.segment || '—'}
                      </div>
                      <div className="fw-semibold" style={{ color: segmentMeta.color }}>
                        {segmentMeta.label}
                      </div>
                      <div className="text-muted small mt-1">{segmentMeta.desc}</div>
                    </div>

                    {client.category && (
                      <div className="mt-3">
                        <InfoRow
                          label="Categorie client"
                          value={client.category.charAt(0).toUpperCase() + client.category.slice(1)}
                        />
                      </div>
                    )}
                  </Col>
                </Row>
              </Tab.Pane>

            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>
    </>
  );
};

export default ClientDetailPage;
