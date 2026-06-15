import React, { useState, useMemo } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiShoppingCart, FiFileText, FiTrendingDown, FiUsers } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import { useGetRapportAchatsQuery } from '../../redux/api/rapportsApi';

const KpiCard = ({ icon: Icon, label, value, color }) => (
  <Card className="shadow-sm h-100">
    <Card.Body className="d-flex align-items-center gap-3">
      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 48, height: 48, backgroundColor: `${color}20`, color }}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-muted small">{label}</div>
        <div className="fw-bold fs-5">{value}</div>
      </div>
    </Card.Body>
  </Card>
);

const RapportAchatsPage = () => {
  usePageTitle('Rapport Achats', [
    { label: 'Accueil', path: '/' },
    { label: 'Rapports', path: '/rapports' },
    { label: 'Achats' },
  ]);

  const currentYear = new Date().getFullYear();
  const [dateFrom, setDateFrom] = useState(`${currentYear}-01-01`);
  const [dateTo, setDateTo]     = useState(`${currentYear}-12-31`);
  const [params, setParams]     = useState({ dateFrom: `${currentYear}-01-01`, dateTo: `${currentYear}-12-31` });

  const { data, isLoading, isError } = useGetRapportAchatsQuery(params);
  const rapport = useMemo(() => data?.data || null, [data]);

  const handleApply = () => setParams({ dateFrom, dateTo });

  if (isLoading) return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  if (isError)   return <Alert variant="danger">Erreur lors du chargement du rapport.</Alert>;

  const kpis = rapport?.kpis || {};
  const evolution = rapport?.evolution || [];
  const topFournisseurs = rapport?.topFournisseurs || [];

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/rapports" className="btn btn-sm btn-outline-secondary"><FiArrowLeft /></Link>
          <div>
            <h1 className="mb-0">Rapport Achats</h1>
            <small className="text-muted">Analyse des achats fournisseurs et commandes</small>
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

      {/* KPIs */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <KpiCard icon={FiTrendingDown} label="Total achats TTC" value={formatMoney(kpis.totalAchats)} color="#ef4444" />
        </Col>
        <Col sm={6} xl={3}>
          <KpiCard icon={FiTrendingDown} label="Total achats HT" value={formatMoney(kpis.totalAchatsHT)} color="#f59e0b" />
        </Col>
        <Col sm={6} xl={3}>
          <KpiCard icon={FiFileText} label="Factures fournisseurs" value={kpis.nbFacturesFourn ?? 0} color="#1a56db" />
        </Col>
        <Col sm={6} xl={3}>
          <KpiCard icon={FiShoppingCart} label="Commandes achat" value={kpis.nbCommandesAchat ?? 0} color="#059669" />
        </Col>
      </Row>

      <Row className="g-4">
        {/* Évolution mensuelle */}
        <Col lg={8}>
          <Card className="shadow-sm h-100">
            <Card.Header><strong>Évolution mensuelle des achats</strong></Card.Header>
            <Card.Body>
              {evolution.length === 0 ? (
                <p className="text-muted text-center py-4">Aucune donnée sur la période</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={evolution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => formatMoney(v)} />
                    <Legend />
                    <Bar dataKey="total" name="Achats TTC" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Top fournisseurs */}
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>Top 10 fournisseurs</strong>
              <FiUsers size={16} className="text-muted" />
            </Card.Header>
            <Card.Body className="p-0">
              {topFournisseurs.length === 0 ? (
                <p className="text-muted text-center py-4 px-3">Aucun fournisseur sur la période</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {topFournisseurs.map((f, i) => (
                    <li key={i} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-secondary rounded-pill" style={{ minWidth: 24 }}>{i + 1}</span>
                        <span className="small fw-medium text-truncate" style={{ maxWidth: 140 }}>{f.designation}</span>
                      </div>
                      <div className="text-end">
                        <div className="small fw-semibold text-danger">{formatMoney(f.total)}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{f.count} facture(s)</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default RapportAchatsPage;
