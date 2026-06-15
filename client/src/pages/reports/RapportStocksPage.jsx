import React, { useMemo } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiPackage, FiAlertTriangle, FiGrid, FiLayers } from 'react-icons/fi';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import { useGetRapportStocksAnalyseQuery } from '../../redux/api/rapportsApi';

const COLORS = ['#1a56db', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6'];

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

const RapportStocksPage = () => {
  usePageTitle('Rapport Stocks', [
    { label: 'Accueil', path: '/' },
    { label: 'Rapports', path: '/rapports' },
    { label: 'Stocks' },
  ]);

  const { data, isLoading, isError } = useGetRapportStocksAnalyseQuery({});
  const rapport = useMemo(() => data?.data || null, [data]);

  if (isLoading) return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  if (isError)   return <Alert variant="danger">Erreur lors du chargement du rapport.</Alert>;

  const kpis           = rapport?.kpis || {};
  const parCategorie   = rapport?.parCategorie || [];
  const topProduits    = rapport?.topProduits || [];

  const pieData = parCategorie.map((c) => ({ name: c.designation, value: c.valeur }));

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/rapports" className="btn btn-sm btn-outline-secondary"><FiArrowLeft /></Link>
          <div>
            <h1 className="mb-0">Rapport Stocks</h1>
            <small className="text-muted">Valorisation et répartition du stock actuel</small>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <KpiCard icon={FiPackage} label="Valeur totale stock" value={formatMoney(kpis.valeurTotale)} color="#1a56db" />
        </Col>
        <Col sm={6} xl={3}>
          <KpiCard icon={FiGrid} label="Références en stock" value={kpis.nbReferences ?? 0} color="#059669" />
        </Col>
        <Col sm={6} xl={3}>
          <KpiCard icon={FiLayers} label="Quantité totale" value={`${(kpis.qteTotal ?? 0).toLocaleString('fr-SN')} unités`} color="#8b5cf6" />
        </Col>
        <Col sm={6} xl={3}>
          <KpiCard icon={FiAlertTriangle} label="Alertes de stock" value={kpis.nbAlertes ?? 0} color="#ef4444" sub="Sous seuil d'alerte" />
        </Col>
      </Row>

      <Row className="g-4">
        {/* Répartition par catégorie */}
        <Col lg={5}>
          <Card className="shadow-sm h-100">
            <Card.Header><strong>Valorisation par catégorie</strong></Card.Header>
            <Card.Body>
              {pieData.length === 0 ? (
                <p className="text-muted text-center py-4">Aucune donnée disponible</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Top produits par valeur */}
        <Col lg={7}>
          <Card className="shadow-sm h-100">
            <Card.Header><strong>Top 10 produits par valeur de stock</strong></Card.Header>
            <Card.Body className="p-0">
              {topProduits.length === 0 ? (
                <p className="text-muted text-center py-4 px-3">Aucun produit en stock</p>
              ) : (
                <Table hover size="sm" className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Produit</th>
                      <th>Code</th>
                      <th className="text-end">Qté</th>
                      <th className="text-end">Valeur stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProduits.map((p, i) => (
                      <tr key={i}>
                        <td><Badge bg="secondary" pill>{i + 1}</Badge></td>
                        <td className="fw-medium small">{p.designation}</td>
                        <td className="text-muted small">{p.code}</td>
                        <td className="text-end small">{p.quantite}</td>
                        <td className="text-end fw-semibold small text-primary">{formatMoney(p.valeurStock)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Tableau catégories */}
        <Col xs={12}>
          <Card className="shadow-sm">
            <Card.Header><strong>Détail par catégorie</strong></Card.Header>
            <Card.Body className="p-0">
              <Table hover size="sm" className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Catégorie</th>
                    <th className="text-end">Nb références</th>
                    <th className="text-end">Valeur stock</th>
                  </tr>
                </thead>
                <tbody>
                  {parCategorie.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-muted py-3">Aucune donnée</td></tr>
                  ) : parCategorie.map((c, i) => (
                    <tr key={i}>
                      <td className="fw-medium small">{c.designation}</td>
                      <td className="text-end small">{c.nbProduits}</td>
                      <td className="text-end fw-semibold small text-primary">{formatMoney(c.valeur)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default RapportStocksPage;
