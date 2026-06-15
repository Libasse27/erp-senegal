import React, { useState, useMemo } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import { Link } from 'react-router-dom';
import {
  FiArrowLeft, FiTrendingUp, FiTrendingDown, FiDollarSign, FiAlertTriangle, FiCreditCard,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import { useGetRapportFinancierQuery } from '../../redux/api/rapportsApi';

const COLORS = ['#1a56db', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

const MODE_LABELS = {
  especes:       'Espèces',
  cheque:        'Chèque',
  virement:      'Virement',
  orange_money:  'Orange Money',
  wave:          'Wave',
  carte_bancaire:'Carte bancaire',
};

const TYPE_LABELS = {
  courant:      'Compte courant',
  epargne:      'Épargne',
  mobile_money: 'Mobile Money',
  caisse:       'Caisse',
};

const TYPE_COLORS = {
  courant:      '#1a56db',
  epargne:      '#059669',
  mobile_money: '#f59e0b',
  caisse:       '#8b5cf6',
};

const KpiCard = ({ icon: Icon, label, value, color, sub, negative }) => (
  <Card className="shadow-sm h-100">
    <Card.Body className="d-flex align-items-center gap-3">
      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 48, height: 48, backgroundColor: `${color}20`, color }}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-muted small">{label}</div>
        <div className="fw-bold fs-5" style={{ color: negative ? '#ef4444' : color }}>{value}</div>
        {sub && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{sub}</div>}
      </div>
    </Card.Body>
  </Card>
);

const RapportFinancierPage = () => {
  usePageTitle('Rapport Financier', [
    { label: 'Accueil', path: '/' },
    { label: 'Rapports', path: '/rapports' },
    { label: 'Financier' },
  ]);

  const currentYear = new Date().getFullYear();
  const [dateFrom, setDateFrom] = useState(`${currentYear}-01-01`);
  const [dateTo, setDateTo]     = useState(`${currentYear}-12-31`);
  const [params, setParams]     = useState({ dateFrom: `${currentYear}-01-01`, dateTo: `${currentYear}-12-31` });

  const { data, isLoading, isError } = useGetRapportFinancierQuery(params);
  const rapport = useMemo(() => data?.data || null, [data]);

  const handleApply = () => setParams({ dateFrom, dateTo });

  const kpis      = rapport?.kpis || {};
  const evolution = rapport?.evolution || [];
  const comptes   = rapport?.comptes || [];
  const parMode   = rapport?.parModeEnc || [];

  const pieData = parMode.map((m) => ({ name: MODE_LABELS[m.mode] || m.mode, value: m.total }));

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/rapports" className="btn btn-sm btn-outline-secondary"><FiArrowLeft /></Link>
          <div>
            <h1 className="mb-0">Rapport Financier</h1>
            <small className="text-muted">Trésorerie, encaissements, décaissements et flux de trésorerie</small>
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
      {isError   && <Alert variant="danger">Erreur lors du chargement du rapport financier.</Alert>}

      {rapport && (
        <>
          {/* KPIs */}
          <Row className="g-3 mb-4">
            <Col sm={6} xl={3}>
              <KpiCard icon={FiDollarSign}   label="Trésorerie totale"     value={formatMoney(kpis.totalTresorerie)}   color="#1a56db" sub="Soldes comptes actuels" />
            </Col>
            <Col sm={6} xl={3}>
              <KpiCard icon={FiTrendingUp}   label="Encaissements période" value={formatMoney(kpis.totalEncaissements)} color="#059669" sub={`${kpis.nbEncaissements} paiements clients`} />
            </Col>
            <Col sm={6} xl={3}>
              <KpiCard icon={FiTrendingDown} label="Décaissements période" value={formatMoney(kpis.totalDecaissements)} color="#ef4444" sub={`${kpis.nbDecaissements} paiements fournisseurs`} negative />
            </Col>
            <Col sm={6} xl={3}>
              <KpiCard
                icon={kpis.soldeNet >= 0 ? FiTrendingUp : FiTrendingDown}
                label="Solde net période"
                value={formatMoney(kpis.soldeNet)}
                color={kpis.soldeNet >= 0 ? '#059669' : '#ef4444'}
                negative={kpis.soldeNet < 0}
                sub="Encaissements − Décaissements"
              />
            </Col>
          </Row>

          {/* Créances en attente */}
          {kpis.creancesClients > 0 && (
            <Alert variant="warning" className="d-flex align-items-center gap-2 mb-4">
              <FiAlertTriangle size={18} />
              <span>
                <strong>{formatMoney(kpis.creancesClients)}</strong> de créances clients en attente sur{' '}
                <strong>{kpis.nbCreances}</strong> facture(s) impayée(s).{' '}
                <Link to="/rapports/recouvrement" className="alert-link">Voir le rapport recouvrement →</Link>
              </span>
            </Alert>
          )}

          <Row className="g-4">
            {/* Évolution Enc. / Déc. */}
            <Col lg={8}>
              <Card className="shadow-sm h-100">
                <Card.Header><strong>Flux mensuels — Encaissements vs Décaissements</strong></Card.Header>
                <Card.Body>
                  {evolution.length === 0 ? (
                    <p className="text-muted text-center py-4">Aucun flux sur la période</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={evolution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => formatMoney(v)} />
                        <Legend />
                        <Bar dataKey="encaissements" name="Encaissements" fill="#059669" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="decaissements" name="Décaissements" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Répartition modes de paiement */}
            <Col lg={4}>
              <Card className="shadow-sm h-100">
                <Card.Header><strong>Encaissements par mode</strong></Card.Header>
                <Card.Body>
                  {pieData.length === 0 ? (
                    <p className="text-muted text-center py-4">Aucun encaissement</p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatMoney(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <ul className="list-unstyled mb-0 mt-2">
                        {parMode.map((m, i) => (
                          <li key={i} className="d-flex justify-content-between align-items-center small py-1 border-bottom">
                            <span className="d-flex align-items-center gap-2">
                              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length] }} />
                              {MODE_LABELS[m.mode] || m.mode}
                            </span>
                            <span className="fw-semibold">{formatMoney(m.total)}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Soldes par compte */}
            <Col xs={12}>
              <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <strong>Soldes des comptes bancaires & caisses</strong>
                  <Link to="/paiements/tresorerie" className="btn btn-sm btn-outline-primary">
                    <FiCreditCard className="me-1" size={14} />Gestion trésorerie
                  </Link>
                </Card.Header>
                <Card.Body className="p-0">
                  {comptes.length === 0 ? (
                    <p className="text-muted text-center py-4 px-3">Aucun compte bancaire configuré</p>
                  ) : (
                    <Table hover size="sm" className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Compte</th>
                          <th>Type</th>
                          <th>Banque / Réseau</th>
                          <th>Numéro</th>
                          <th className="text-end">Solde actuel</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {comptes.map((c) => (
                          <tr key={c._id}>
                            <td className="fw-medium small">{c.nom}</td>
                            <td>
                              <Badge bg="light" text="dark" style={{ color: TYPE_COLORS[c.type] || '#333', borderColor: TYPE_COLORS[c.type] }}>
                                {TYPE_LABELS[c.type] || c.type}
                              </Badge>
                            </td>
                            <td className="text-muted small">{c.banque || '—'}</td>
                            <td className="text-muted small">{c.numeroCompte ? `••••${c.numeroCompte.slice(-4)}` : '—'}</td>
                            <td className={`text-end fw-bold small ${c.soldeActuel < 0 ? 'text-danger' : 'text-success'}`}>
                              {formatMoney(c.soldeActuel)}
                            </td>
                            <td className="text-end">
                              {c.isDefault && <Badge bg="primary" pill style={{ fontSize: '0.65rem' }}>Défaut</Badge>}
                            </td>
                          </tr>
                        ))}
                        <tr className="table-light fw-bold">
                          <td colSpan={4} className="text-end small">Total trésorerie</td>
                          <td className="text-end small text-primary">{formatMoney(kpis.totalTresorerie)}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </>
  );
};

export default RapportFinancierPage;
