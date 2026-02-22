import React, { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import {
  FiDollarSign,
  FiShoppingCart,
  FiTrendingUp,
  FiPercent,
  FiDownload,
  FiPrinter,
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <Card className="stat-card h-100">
    <Card.Body className="d-flex align-items-center">
      <div
        className="rounded-circle d-flex align-items-center justify-content-center me-3"
        style={{
          width: 48,
          height: 48,
          backgroundColor: `${color}15`,
          color: color,
        }}
      >
        <Icon size={24} />
      </div>
      <div>
        <div className="stat-label">{title}</div>
        <div className="stat-value" style={{ color }}>
          {value}
        </div>
        {subtitle && <small className="text-muted">{subtitle}</small>}
      </div>
    </Card.Body>
  </Card>
);

const SalesReportPage = () => {
  usePageTitle('Rapport Ventes', [
    { label: 'Accueil', path: '/' },
    { label: 'Rapports', path: '/rapports' },
    { label: 'Ventes', path: '/rapports/ventes' },
  ]);

  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]
  );
  const [dateTo, setDateTo] = useState(
    new Date().toISOString().split('T')[0]
  );

  const stats = {
    caTotal: 45800000,
    nombreVentes: 142,
    panierMoyen: 322535,
    margeTotal: 13740000,
    tauxMarge: 30,
  };

  const topClients = [
    {
      id: 1,
      nom: 'SONATEL',
      ca: 8500000,
      nombreFactures: 12,
      tauxPaiement: 100,
    },
    {
      id: 2,
      nom: 'ORANGE SENEGAL',
      ca: 6200000,
      nombreFactures: 8,
      tauxPaiement: 95,
    },
    {
      id: 3,
      nom: 'EXPRESSO SENEGAL',
      ca: 5100000,
      nombreFactures: 10,
      tauxPaiement: 100,
    },
    {
      id: 4,
      nom: 'SENELEC',
      ca: 4800000,
      nombreFactures: 6,
      tauxPaiement: 80,
    },
    {
      id: 5,
      nom: 'SOCOCIM',
      ca: 3900000,
      nombreFactures: 9,
      tauxPaiement: 90,
    },
  ];

  const topProduits = [
    {
      id: 1,
      nom: 'Ordinateur Portable Dell XPS 15',
      quantite: 45,
      ca: 22500000,
      marge: 6750000,
    },
    {
      id: 2,
      nom: 'Ecran Samsung 27"',
      quantite: 78,
      ca: 11700000,
      marge: 3510000,
    },
    {
      id: 3,
      nom: 'Clavier Logitech MX Keys',
      quantite: 120,
      ca: 6000000,
      marge: 1800000,
    },
    {
      id: 4,
      nom: 'Souris Logitech MX Master 3',
      quantite: 95,
      ca: 4750000,
      marge: 1425000,
    },
    {
      id: 5,
      nom: 'Imprimante HP LaserJet Pro',
      quantite: 28,
      ca: 8400000,
      marge: 2520000,
    },
  ];

  const evolutionCA = [
    { semaine: 'S1', ca: 9200000 },
    { semaine: 'S2', ca: 11500000 },
    { semaine: 'S3', ca: 10800000 },
    { semaine: 'S4', ca: 14300000 },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-white p-2 border rounded shadow-sm"
          style={{ fontSize: '0.875rem' }}
        >
          <p className="mb-0 fw-semibold">{payload[0].payload.semaine}</p>
          <p className="mb-0 text-success">{formatMoney(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="page-header">
        <h1>Rapport des Ventes</h1>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm">
            <FiPrinter className="me-1" />
            Imprimer
          </Button>
          <Button variant="outline-primary" size="sm">
            <FiDownload className="me-1" />
            Exporter PDF
          </Button>
        </div>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Date debut</Form.Label>
                <Form.Control
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Date fin</Form.Label>
                <Form.Control
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button variant="primary" className="w-100">
                Actualiser
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <StatCard
            title="CA Total"
            value={formatMoney(stats.caTotal)}
            icon={FiDollarSign}
            color="#059669"
            subtitle={`${formatDate(dateFrom)} - ${formatDate(dateTo)}`}
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Nombre de ventes"
            value={stats.nombreVentes}
            icon={FiShoppingCart}
            color="#1a56db"
            subtitle="Factures emises"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Panier moyen"
            value={formatMoney(stats.panierMoyen)}
            icon={FiTrendingUp}
            color="#ff6900"
            subtitle="Par facture"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Marge totale"
            value={formatMoney(stats.margeTotal)}
            icon={FiPercent}
            color="#00b4d8"
            subtitle={`Taux: ${stats.tauxMarge}%`}
          />
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={12}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Evolution du CA par semaine</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolutionCA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semaine" />
                  <YAxis
                    tickFormatter={(value) =>
                      `${(value / 1000000).toFixed(0)}M`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="ca"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ fill: '#059669', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Top 5 Clients par CA</h6>
              <Badge bg="primary">{topClients.length}</Badge>
            </Card.Header>
            <Card.Body>
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th className="text-end">CA</th>
                    <th className="text-center">Factures</th>
                    <th className="text-center">Paiement</th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.map((client) => (
                    <tr key={client.id}>
                      <td className="fw-semibold">{client.nom}</td>
                      <td className="text-end">
                        {formatMoney(client.ca)}
                      </td>
                      <td className="text-center">
                        <Badge bg="secondary">{client.nombreFactures}</Badge>
                      </td>
                      <td className="text-center">
                        <Badge
                          bg={
                            client.tauxPaiement === 100
                              ? 'success'
                              : client.tauxPaiement >= 80
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {client.tauxPaiement}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Top 5 Produits par CA</h6>
              <Badge bg="primary">{topProduits.length}</Badge>
            </Card.Header>
            <Card.Body>
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th className="text-center">Qte</th>
                    <th className="text-end">CA</th>
                    <th className="text-end">Marge</th>
                  </tr>
                </thead>
                <tbody>
                  {topProduits.map((produit) => (
                    <tr key={produit.id}>
                      <td className="fw-semibold">{produit.nom}</td>
                      <td className="text-center">
                        <Badge bg="info">{produit.quantite}</Badge>
                      </td>
                      <td className="text-end">
                        {formatMoney(produit.ca)}
                      </td>
                      <td className="text-end text-success">
                        {formatMoney(produit.marge)}
                      </td>
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

export default SalesReportPage;
