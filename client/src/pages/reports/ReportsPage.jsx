import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import {
  FiTrendingUp,
  FiShoppingCart,
  FiPackage,
  FiDollarSign,
  FiBarChart2,
  FiFileText,
  FiPieChart,
  FiActivity,
} from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/formatters';

const ReportCard = ({ icon: Icon, title, description, link, color }) => (
  <Card className="h-100 shadow-sm">
    <Card.Body className="d-flex flex-column">
      <div className="d-flex align-items-center mb-3">
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
        <h5 className="mb-0">{title}</h5>
      </div>
      <p className="text-muted flex-grow-1">{description}</p>
      <Button as={Link} to={link} variant="outline-primary" size="sm">
        Generer le rapport
      </Button>
    </Card.Body>
  </Card>
);

const ReportsPage = () => {
  usePageTitle('Rapports', [
    { label: 'Accueil', path: '/' },
    { label: 'Rapports', path: '/rapports' },
  ]);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const reports = [
    {
      id: 'ventes',
      icon: FiTrendingUp,
      title: 'Rapport Ventes',
      description: 'Analyse detaillee des ventes: CA, top clients, produits vendus, marges',
      link: '/rapports/ventes',
      color: '#059669',
    },
    {
      id: 'achats',
      icon: FiShoppingCart,
      title: 'Rapport Achats',
      description: 'Suivi des achats: commandes fournisseurs, factures, paiements',
      link: '/rapports/achats',
      color: '#1a56db',
    },
    {
      id: 'stocks',
      icon: FiPackage,
      title: 'Rapport Stocks',
      description: 'Etat des stocks: inventaire, mouvements, alertes, valorisation',
      link: '/rapports/stocks',
      color: '#ff6900',
    },
    {
      id: 'financier',
      icon: FiDollarSign,
      title: 'Rapport Financier',
      description: 'Tresorerie, encaissements, decaissements, soldes bancaires',
      link: '/rapports/financier',
      color: '#00b4d8',
    },
    {
      id: 'abc',
      icon: FiBarChart2,
      title: 'Analyse ABC',
      description: 'Classification des produits et clients par importance (80-15-5)',
      link: '/rapports/abc',
      color: '#d97706',
    },
    {
      id: 'comptable',
      icon: FiFileText,
      title: 'Rapports Comptables',
      description: 'Grand livre, balance, journaux, compte de resultat, bilan',
      link: '/rapports/comptable',
      color: '#6366f1',
    },
    {
      id: 'performance',
      icon: FiPieChart,
      title: 'Performance Commerciale',
      description: 'KPIs commerciaux: taux de conversion, panier moyen, fidelisation',
      link: '/rapports/performance',
      color: '#ec4899',
    },
    {
      id: 'activite',
      icon: FiActivity,
      title: 'Rapport d\'Activite',
      description: 'Synthese generale de l\'activite commerciale et comptable',
      link: '/rapports/activite',
      color: '#8b5cf6',
    },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Rapports et Analyses</h1>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h6 className="mb-3">Periode d'analyse</h6>
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
              <div className="w-100">
                <Button
                  variant="outline-secondary"
                  className="w-100"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                >
                  Reinitialiser
                </Button>
              </div>
            </Col>
          </Row>
          {dateFrom && dateTo && (
            <div className="mt-3">
              <small className="text-muted">
                Periode selectionnee: du {formatDate(dateFrom)} au{' '}
                {formatDate(dateTo)}
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      <Row className="g-3">
        {reports.map((report) => (
          <Col key={report.id} sm={6} lg={4} xl={3}>
            <ReportCard {...report} />
          </Col>
        ))}
      </Row>
    </>
  );
};

export default ReportsPage;
