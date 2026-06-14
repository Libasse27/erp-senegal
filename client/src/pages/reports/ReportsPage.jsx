import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import {
  FiTrendingUp,
  FiShoppingCart,
  FiPackage,
  FiDollarSign,
  FiBarChart2,
  FiFileText,
  FiPieChart,
  FiActivity,
  FiDownload,
  FiAlertTriangle,
} from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/formatters';
import usePdfActions from '../../hooks/usePdfActions';

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
  const { downloadPdf, isLoading: pdfLoading } = usePdfActions();

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

      {/* ── Téléchargements PDF rapides ── */}
      <Card className="shadow-sm mt-4">
        <Card.Header className="bg-white">
          <h6 className="mb-0 d-flex align-items-center gap-2">
            <FiDownload size={16} />
            Téléchargements PDF rapides
          </h6>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col sm={6} md={4}>
              <div className="border rounded p-3 h-100">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 36, height: 36, background: '#b71c1c18', color: '#b71c1c' }}
                  >
                    <FiAlertTriangle size={16} />
                  </div>
                  <strong className="small">Rapport de Recouvrement</strong>
                </div>
                <p className="text-muted small mb-3">
                  Créances impayées classées par âge (0–30j, 31–60j, 61–90j, +90j)
                </p>
                <div className="d-flex gap-2">
                  <Button
                    as={Link}
                    to="/rapports/recouvrement"
                    variant="outline-danger"
                    size="sm"
                    className="flex-grow-1"
                  >
                    Voir le rapport
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={pdfLoading}
                    onClick={() => downloadPdf('/rapports/recouvrement/pdf', 'rapport-recouvrement.pdf')}
                    title="Télécharger PDF"
                  >
                    {pdfLoading ? <Spinner size="sm" /> : <FiDownload size={14} />}
                  </Button>
                </div>
              </div>
            </Col>
            <Col sm={6} md={4}>
              <div className="border rounded p-3 h-100">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 36, height: 36, background: '#1b5e2018', color: '#1b5e20' }}
                  >
                    <FiPackage size={16} />
                  </div>
                  <strong className="small">Rapport d'Inventaire Stock</strong>
                </div>
                <p className="text-muted small mb-3">
                  État du stock valorisé au CUMP — toutes références avec alertes
                </p>
                <Button
                  variant="outline-success"
                  size="sm"
                  className="w-100"
                  disabled={pdfLoading}
                  onClick={() => downloadPdf('/rapports/stock/pdf', 'rapport-stock.pdf')}
                >
                  {pdfLoading ? <Spinner size="sm" className="me-1" /> : <FiDownload className="me-1" />}
                  Télécharger PDF
                </Button>
              </div>
            </Col>
            <Col sm={6} md={4}>
              <div className="border rounded p-3 h-100">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 36, height: 36, background: '#0d47a118', color: '#0d47a1' }}
                  >
                    <FiFileText size={16} />
                  </div>
                  <strong className="small">Relevé de Compte Client</strong>
                </div>
                <p className="text-muted small mb-3">
                  Accédez à la fiche d'un client et cliquez sur <strong>"Relevé PDF"</strong> pour
                  télécharger son relevé de compte (factures + paiements + solde).
                </p>
                <Button
                  as={Link}
                  to="/clients"
                  variant="outline-primary"
                  size="sm"
                  className="w-100"
                >
                  Aller aux Clients
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </>
  );
};

export default ReportsPage;
