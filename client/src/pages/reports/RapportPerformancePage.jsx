import React, { useState, useMemo } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { Link } from 'react-router-dom';
import {
  FiArrowLeft, FiFileText, FiShoppingBag, FiDollarSign, FiUsers, FiTrendingUp,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import { useGetRapportPerformanceQuery } from '../../redux/api/rapportsApi';

const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#1a56db', '#059669'];

const KpiCard = ({ icon: Icon, label, value, color, sub }) => (
  <Card className="shadow-sm h-100">
    <Card.Body className="d-flex align-items-center gap-3">
      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 48, height: 48, backgroundColor: `${color}20`, color }}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-muted small">{label}</div>
        <div className="fw-bold fs-5">{value}</div>
        {sub && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{sub}</div>}
      </div>
    </Card.Body>
  </Card>
);

const RapportPerformancePage = () => {
  usePageTitle('Performance Commerciale', [
    { label: 'Accueil', path: '/' },
    { label: 'Rapports', path: '/rapports' },
    { label: 'Performance' },
  ]);

  const currentYear = new Date().getFullYear();
  const [dateFrom, setDateFrom] = useState(`${currentYear}-01-01`);
  const [dateTo, setDateTo]     = useState(`${currentYear}-12-31`);
  const [params, setParams]     = useState({ dateFrom: `${currentYear}-01-01`, dateTo: `${currentYear}-12-31` });

  const { data, isLoading, isError } = useGetRapportPerformanceQuery(params);
  const rapport = useMemo(() => data?.data || null, [data]);

  const handleApply = () => setParams({ dateFrom, dateTo });

  const kpis   = rapport?.kpis || {};
  const funnel = rapport?.funnel || [];
  const maxFunnel = funnel.reduce((m, f) => Math.max(m, f.count), 1);

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/rapports" className="btn btn-sm btn-outline-secondary"><FiArrowLeft /></Link>
          <div>
            <h1 className="mb-0">Performance Commerciale</h1>
            <small className="text-muted">Taux de conversion, panier moyen, funnel de vente</small>
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
          {/* KPIs */}
          <Row className="g-3 mb-4">
            <Col sm={6} xl={3}>
              <KpiCard icon={FiTrendingUp} label="Taux conv. devis" value={`${kpis.tauxConversionDevis}%`} color="#1a56db" sub={`${kpis.nbDevisAcceptes}/${kpis.nbDevis} devis acceptés`} />
            </Col>
            <Col sm={6} xl={3}>
              <KpiCard icon={FiShoppingBag} label="Taux conv. commandes" value={`${kpis.tauxConversionCommande}%`} color="#8b5cf6" sub={`${kpis.nbCommandes}/${kpis.nbDevis} → commandes`} />
            </Col>
            <Col sm={6} xl={3}>
              <KpiCard icon={FiDollarSign} label="Panier moyen" value={formatMoney(kpis.panierMoyen)} color="#059669" sub="par facture de vente" />
            </Col>
            <Col sm={6} xl={3}>
              <KpiCard icon={FiUsers} label="Nouveaux clients" value={kpis.nouveauxClients ?? 0} color="#f59e0b" sub="créés sur la période" />
            </Col>
          </Row>

          <Row className="g-4">
            {/* Funnel visuel */}
            <Col lg={5}>
              <Card className="shadow-sm h-100">
                <Card.Header><strong>Funnel de vente</strong></Card.Header>
                <Card.Body>
                  {funnel.map((step, i) => (
                    <div key={i} className="mb-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="fw-medium">{step.etape}</span>
                        <span className="fw-bold" style={{ color: step.color }}>{step.count}</span>
                      </div>
                      <ProgressBar
                        now={maxFunnel > 0 ? (step.count / maxFunnel) * 100 : 0}
                        style={{ height: 20, backgroundColor: '#f1f5f9' }}
                      >
                        <div
                          className="progress-bar"
                          style={{ width: `${maxFunnel > 0 ? (step.count / maxFunnel) * 100 : 0}%`, backgroundColor: step.color }}
                        />
                      </ProgressBar>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            {/* Graphique en barres funnel */}
            <Col lg={7}>
              <Card className="shadow-sm h-100">
                <Card.Header><strong>Volume par étape</strong></Card.Header>
                <Card.Body>
                  {funnel.length === 0 ? (
                    <p className="text-muted text-center py-4">Aucune donnée sur la période</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={funnel} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="etape" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" name="Nombre" radius={[6, 6, 0, 0]}>
                          {funnel.map((entry, i) => (
                            <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Synthèse chiffrée */}
            <Col xs={12}>
              <Card className="shadow-sm">
                <Card.Header><strong>Synthèse financière de la période</strong></Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    {[
                      { label: 'CA Facturé (TTC)', value: formatMoney(kpis.totalCA), color: '#059669' },
                      { label: 'Montant Encaissé', value: formatMoney(kpis.totalEncaisse), color: '#1a56db' },
                      { label: 'Taux d\'encaissement', value: kpis.totalCA > 0 ? `${Math.round((kpis.totalEncaisse / kpis.totalCA) * 100)}%` : '—', color: '#8b5cf6' },
                      { label: 'Devis créés', value: kpis.nbDevis ?? 0, color: '#f59e0b' },
                      { label: 'Commandes', value: kpis.nbCommandes ?? 0, color: '#6366f1' },
                      { label: 'Factures émises', value: kpis.nbFactures ?? 0, color: '#0ea5e9' },
                    ].map((stat) => (
                      <Col key={stat.label} sm={6} md={4} xl={2}>
                        <div className="text-center p-3 rounded-2 border h-100">
                          <div className="fw-bold fs-5" style={{ color: stat.color }}>{stat.value}</div>
                          <div className="text-muted small">{stat.label}</div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </>
  );
};

export default RapportPerformancePage;
