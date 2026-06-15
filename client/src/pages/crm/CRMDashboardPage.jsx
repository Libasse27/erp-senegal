import React, { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { Link } from 'react-router-dom';
import {
  FiPlus, FiTrendingUp, FiTarget, FiActivity, FiDollarSign, FiChevronRight,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import {
  useGetPipelineStatsQuery,
  useGetOpportunitesQuery,
  useUpdateOpportuniteMutation,
} from '../../redux/api/crmApi';

const ETAPES = [
  { key: 'prospect',      label: 'Prospect',      color: '#6b7280', bg: '#f3f4f6' },
  { key: 'qualification', label: 'Qualification', color: '#2563eb', bg: '#eff6ff' },
  { key: 'proposition',   label: 'Proposition',   color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'negociation',   label: 'Négociation',   color: '#d97706', bg: '#fffbeb' },
  { key: 'gagne',         label: 'Gagné ✓',       color: '#059669', bg: '#ecfdf5' },
  { key: 'perdu',         label: 'Perdu ✗',       color: '#dc2626', bg: '#fef2f2' },
];

const ETAPE_SUIVANTE = {
  prospect: 'qualification', qualification: 'proposition',
  proposition: 'negociation', negociation: 'gagne',
};

const SOURCE_LABELS = {
  appel_entrant: 'Appel', email: 'Email', site_web: 'Site web',
  recommandation: 'Reco.', salon: 'Salon', prospection: 'Prospection', autre: 'Autre',
};

const CRMDashboardPage = () => {
  usePageTitle('CRM — Pipeline', [
    { label: 'Accueil', path: '/' },
    { label: 'CRM' },
    { label: 'Pipeline' },
  ]);

  const [view, setView] = useState('kanban');

  const { data: statsData, isLoading: loadingStats } = useGetPipelineStatsQuery();
  const { data: listData,  isLoading: loadingList  } = useGetOpportunitesQuery({ isActive: 'true', limit: 200 });
  const [updateOpp, { isLoading: updating }] = useUpdateOpportuniteMutation();

  const stats       = statsData?.data || {};
  const opportunites = listData?.data  || [];

  const handleEtapeChange = async (opp, nouvelleEtape) => {
    try {
      await updateOpp({ id: opp._id, etape: nouvelleEtape }).unwrap();
      toast.success(`→ ${ETAPES.find((e) => e.key === nouvelleEtape)?.label}`);
    } catch {
      toast.error('Erreur lors du changement d\'étape');
    }
  };

  if (loadingStats || loadingList) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  }

  const pipeline = stats.pipeline || [];

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="mb-0">CRM — Pipeline Commercial</h1>
            <small className="text-muted">Suivi des opportunités de vente</small>
          </div>
          <div className="d-flex gap-2">
            <div className="btn-group">
              <Button variant={view === 'kanban' ? 'primary' : 'outline-secondary'} size="sm" onClick={() => setView('kanban')}>Kanban</Button>
              <Button variant={view === 'liste'  ? 'primary' : 'outline-secondary'} size="sm" onClick={() => setView('liste')}>Liste</Button>
            </div>
            <Link to="/crm/opportunites/nouveau" className="btn btn-primary btn-sm">
              <FiPlus className="me-1" />Nouvelle opportunité
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <Row className="g-3 mb-4">
        {[
          { label: 'Pipeline actif',     val: stats.totalActives || 0,                       icon: FiTarget,    color: '#2563eb' },
          { label: 'Valeur pondérée',    val: formatMoney(stats.montantPipelineTotal || 0),  icon: FiDollarSign,color: '#7c3aed', money: true },
          { label: 'Gagnés ce mois',     val: stats.gagnesMois || 0,                         icon: FiTrendingUp,color: '#059669' },
          { label: 'Activités planif.', val: stats.activitesPlanifiees || 0,                 icon: FiActivity,  color: '#d97706' },
        ].map((k) => (
          <Col key={k.label} sm={6} xl={3}>
            <Card className="shadow-sm h-100">
              <Card.Body className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 46, height: 46, backgroundColor: `${k.color}20`, color: k.color }}>
                  <k.icon size={20} />
                </div>
                <div>
                  <div className="text-muted small">{k.label}</div>
                  <div className="fw-bold fs-5" style={{ color: k.color }}>{k.val}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Résumé par étape */}
      <Row className="g-2 mb-4">
        {pipeline.map((p) => {
          const etape = ETAPES.find((e) => e.key === p.etape) || {};
          return (
            <Col key={p.etape} xs={6} md={4} xl={2}>
              <Card className="shadow-sm text-center py-2" style={{ borderTop: `3px solid ${etape.color}` }}>
                <div className="fw-bold fs-5" style={{ color: etape.color }}>{p.count}</div>
                <div className="small text-muted">{etape.label}</div>
                {p.montantTotal > 0 && (
                  <div className="small fw-medium">{formatMoney(p.montantTotal)}</div>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* VUE KANBAN */}
      {view === 'kanban' && (
        <div style={{ overflowX: 'auto' }}>
          <div className="d-flex gap-3" style={{ minWidth: 900 }}>
            {ETAPES.map((etape) => {
              const cartes = opportunites.filter((o) => o.etape === etape.key);
              return (
                <div key={etape.key} style={{ minWidth: 200, flex: 1 }}>
                  {/* Entête colonne */}
                  <div className="rounded-top px-3 py-2 d-flex justify-content-between align-items-center mb-2"
                    style={{ backgroundColor: etape.bg, borderBottom: `2px solid ${etape.color}` }}>
                    <span className="fw-semibold small" style={{ color: etape.color }}>{etape.label}</span>
                    <Badge style={{ backgroundColor: etape.color }}>{cartes.length}</Badge>
                  </div>

                  {/* Cartes */}
                  <div className="d-flex flex-column gap-2">
                    {cartes.map((opp) => (
                      <Card key={opp._id} className="shadow-sm" style={{ borderLeft: `3px solid ${etape.color}` }}>
                        <Card.Body className="p-2">
                          <div className="fw-semibold small mb-1" style={{ fontSize: '0.8rem' }}>
                            <Link to={`/crm/opportunites/${opp._id}`} className="text-dark text-decoration-none">
                              {opp.titre}
                            </Link>
                          </div>
                          {opp.client && (
                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                              {opp.client.nom}
                            </div>
                          )}
                          {opp.montantEstime > 0 && (
                            <div className="fw-medium text-success" style={{ fontSize: '0.75rem' }}>
                              {formatMoney(opp.montantEstime)}
                            </div>
                          )}
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <Badge bg="secondary" style={{ fontSize: '0.65rem' }}>{opp.probabilite}%</Badge>
                            {ETAPE_SUIVANTE[opp.etape] && (
                              <Button variant="link" size="sm" className="p-0 text-muted"
                                style={{ fontSize: '0.7rem' }}
                                disabled={updating}
                                onClick={() => handleEtapeChange(opp, ETAPE_SUIVANTE[opp.etape])}
                                title={`Passer à ${ETAPES.find((e) => e.key === ETAPE_SUIVANTE[opp.etape])?.label}`}>
                                <FiChevronRight size={14} />
                              </Button>
                            )}
                            {opp.etape === 'negociation' && (
                              <Button variant="link" size="sm" className="p-0 text-danger"
                                style={{ fontSize: '0.7rem' }}
                                disabled={updating}
                                onClick={() => handleEtapeChange(opp, 'perdu')}>
                                ✗
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                    {cartes.length === 0 && (
                      <div className="text-muted text-center small py-3" style={{ border: '1px dashed #dee2e6', borderRadius: 6 }}>
                        Vide
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VUE LISTE */}
      {view === 'liste' && (
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <table className="table table-hover table-sm align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Référence</th>
                  <th>Titre</th>
                  <th>Client</th>
                  <th>Étape</th>
                  <th className="text-end">Montant estimé</th>
                  <th className="text-center">Proba.</th>
                  <th>Source</th>
                  <th>Échéance</th>
                </tr>
              </thead>
              <tbody>
                {opportunites.map((opp) => {
                  const etape = ETAPES.find((e) => e.key === opp.etape) || {};
                  return (
                    <tr key={opp._id}>
                      <td className="font-monospace small text-muted">{opp.reference}</td>
                      <td>
                        <Link to={`/crm/opportunites/${opp._id}`} className="fw-medium text-dark text-decoration-none small">
                          {opp.titre}
                        </Link>
                      </td>
                      <td className="small">{opp.client?.nom || <span className="text-muted">—</span>}</td>
                      <td>
                        <Badge style={{ backgroundColor: etape.color, fontSize: '0.72rem' }}>
                          {etape.label}
                        </Badge>
                      </td>
                      <td className="text-end small fw-semibold">{opp.montantEstime > 0 ? formatMoney(opp.montantEstime) : '—'}</td>
                      <td className="text-center">
                        <Badge bg={opp.probabilite >= 75 ? 'success' : opp.probabilite >= 40 ? 'warning' : 'secondary'}>
                          {opp.probabilite}%
                        </Badge>
                      </td>
                      <td className="small text-muted">{SOURCE_LABELS[opp.sourceContact] || '—'}</td>
                      <td className="small">{opp.dateEcheance ? new Date(opp.dateEcheance).toLocaleDateString('fr-FR') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {opportunites.length === 0 && (
              <p className="text-muted text-center py-4">
                Aucune opportunité active.{' '}
                <Link to="/crm/opportunites/nouveau">En créer une →</Link>
              </p>
            )}
          </Card.Body>
        </Card>
      )}
    </>
  );
};

export default CRMDashboardPage;
