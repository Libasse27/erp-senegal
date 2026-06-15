import React, { useState, useMemo } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import { useGetRapportActiviteQuery } from '../../redux/api/rapportsApi';

const ICON_MAP = {
  devis:        '📄',
  commandes:    '🛒',
  factures:     '🧾',
  paiements:    '💰',
  achats:       '📦',
  fournisseur:  '🏭',
  clients:      '👥',
  stocks:       '🗄️',
};

const RapportActivitePage = () => {
  usePageTitle("Rapport d'Activité", [
    { label: 'Accueil', path: '/' },
    { label: 'Rapports', path: '/rapports' },
    { label: 'Activité' },
  ]);

  const currentYear = new Date().getFullYear();
  const [dateFrom, setDateFrom] = useState(`${currentYear}-01-01`);
  const [dateTo, setDateTo]     = useState(`${currentYear}-12-31`);
  const [params, setParams]     = useState({ dateFrom: `${currentYear}-01-01`, dateTo: `${currentYear}-12-31` });

  const { data, isLoading, isError } = useGetRapportActiviteQuery(params);
  const rapport = useMemo(() => data?.data || null, [data]);

  const handleApply = () => setParams({ dateFrom, dateTo });

  const kpis       = rapport?.kpis || {};
  const modules    = rapport?.modules || [];
  const evolution  = rapport?.evolutionCA || [];

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/rapports" className="btn btn-sm btn-outline-secondary"><FiArrowLeft /></Link>
          <div>
            <h1 className="mb-0">Rapport d'Activité Globale</h1>
            <small className="text-muted">Synthèse de toute l'activité de l'entreprise sur la période</small>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Label className="small fw-semibold">Date début</Form.Label>
              <Form.Control type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">Date fin</Form.Label>
              <Form.Control type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </Col>
            <Col md="auto">
              <Button variant="primary" onClick={handleApply}>Appliquer</Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {isLoading && <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>}
      {isError   && <Alert variant="danger">Erreur lors du chargement.</Alert>}

      {rapport && (
        <>
          {/* KPIs financiers principaux */}
          <Row className="g-3 mb-4">
            <Col md={4}>
              <Card className="shadow-sm text-center p-3 h-100" style={{ borderTop: '4px solid #059669' }}>
                <div className="fs-2 fw-bold text-success">{formatMoney(kpis.caFactures)}</div>
                <div className="text-muted small">CA Facturé (TTC)</div>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm text-center p-3 h-100" style={{ borderTop: '4px solid #1a56db' }}>
                <div className="fs-2 fw-bold text-primary">{formatMoney(kpis.totalPaiements)}</div>
                <div className="text-muted small">Paiements Encaissés</div>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm text-center p-3 h-100" style={{ borderTop: '4px solid #ef4444' }}>
                <div className="fs-2 fw-bold text-danger">{formatMoney(kpis.totalAchats)}</div>
                <div className="text-muted small">Total Achats (TTC)</div>
              </Card>
            </Col>
          </Row>

          {/* Modules d'activité */}
          <Card className="shadow-sm mb-4">
            <Card.Header><strong>Activité par module</strong></Card.Header>
            <Card.Body>
              <Row className="g-3">
                {modules.map((m) => (
                  <Col key={m.label} sm={6} md={4} xl={3}>
                    <div className="border rounded-2 p-3 text-center h-100" style={{ backgroundColor: `${m.color}08` }}>
                      <div style={{ fontSize: '1.8rem', lineHeight: 1, marginBottom: 6 }}>
                        {ICON_MAP[m.icon] || '📊'}
                      </div>
                      <div className="fw-bold fs-4" style={{ color: m.color }}>{m.count.toLocaleString('fr-SN')}</div>
                      <div className="text-muted small">{m.label}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          {/* Évolution du CA */}
          <Card className="shadow-sm">
            <Card.Header><strong>Évolution mensuelle du CA</strong></Card.Header>
            <Card.Body>
              {evolution.length === 0 ? (
                <p className="text-muted text-center py-4">Aucune facturation sur la période</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={evolution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => formatMoney(v)} />
                    <Bar dataKey="ca" name="CA TTC" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </>
  );
};

export default RapportActivitePage;
