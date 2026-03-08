import React from 'react';
import { Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import {
  FiDollarSign,
  FiUsers,
  FiFileText,
  FiAlertTriangle,
  FiPlus,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import { useGetDashboardStatsQuery } from '../../redux/api/dashboardApi';
import StatCard from '../../components/ui/StatCard';
import { SalesEvolutionChart, TopProductsChart } from '../../components/charts';

const DashboardPage = () => {
  usePageTitle('Tableau de bord', [{ label: 'Accueil', path: '/' }]);

  const { data: statsData, isLoading } = useGetDashboardStatsQuery();
  const stats = statsData?.data || {};

  const revenueData = [
    { mois: 'Jan', ca: 4500000 },
    { mois: 'Fev', ca: 5200000 },
    { mois: 'Mar', ca: 3800000 },
    { mois: 'Avr', ca: 6100000 },
    { mois: 'Mai', ca: 5500000 },
    { mois: 'Jun', ca: 7200000 },
    { mois: 'Jul', ca: 6800000 },
    { mois: 'Aou', ca: 5900000 },
    { mois: 'Sep', ca: 7500000 },
    { mois: 'Oct', ca: 8100000 },
    { mois: 'Nov', ca: 7800000 },
    { mois: 'Dec', ca: 9200000 },
  ];

  const paymentData = [
    { name: 'Especes', value: 35 },
    { name: 'Virement', value: 25 },
    { name: 'Orange Money', value: 20 },
    { name: 'Wave', value: 15 },
    { name: 'Cheque', value: 5 },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'facture',
      icon: FiFileText,
      color: '#1a56db',
      message: 'Facture FAC-2026-001 creee',
      time: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
      id: 2,
      type: 'paiement',
      icon: FiCreditCard,
      color: '#059669',
      message: 'Paiement de 500 000 FCFA recu',
      time: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      id: 3,
      type: 'client',
      icon: FiUsers,
      color: '#ff6900',
      message: 'Nouveau client ajoute: SONATEL',
      time: new Date(Date.now() - 1000 * 60 * 120),
    },
    {
      id: 4,
      type: 'alerte',
      icon: FiAlertTriangle,
      color: '#dc2626',
      message: 'Stock faible: Produit XYZ',
      time: new Date(Date.now() - 1000 * 60 * 180),
    },
    {
      id: 5,
      type: 'devis',
      icon: FiCheckCircle,
      color: '#059669',
      message: 'Devis DEV-2026-015 accepte',
      time: new Date(Date.now() - 1000 * 60 * 240),
    },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Tableau de bord</h1>
        <div className="d-flex gap-2">
          <Button as={Link} to="/ventes/devis/nouveau" variant="outline-primary" size="sm">
            <FiPlus className="me-1" />
            Nouveau devis
          </Button>
          <Button as={Link} to="/ventes/factures/nouveau" variant="outline-primary" size="sm">
            <FiFileText className="me-1" />
            Nouvelle facture
          </Button>
          <Button as={Link} to="/paiements/nouveau" variant="primary" size="sm">
            <FiCreditCard className="me-1" />
            Nouveau paiement
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <StatCard
            title="CA du mois"
            value={formatMoney(stats.caDuMois || 0)}
            icon={FiDollarSign}
            color="#059669"
            subtitle="Fevrier 2026"
            loading={isLoading}
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Clients actifs"
            value={stats.clientsActifs || 0}
            icon={FiUsers}
            color="#1a56db"
            subtitle="Total"
            loading={isLoading}
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Factures impayees"
            value={stats.facturesImpayees || 0}
            icon={FiFileText}
            color="#d97706"
            subtitle="En attente"
            loading={isLoading}
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Alertes stock"
            value={stats.alertesStock || 0}
            icon={FiAlertTriangle}
            color="#dc2626"
            subtitle="Rupture ou faible"
            loading={isLoading}
          />
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Evolution du chiffre d'affaires (2026)</h6>
            </Card.Header>
            <Card.Body>
              <SalesEvolutionChart
                data={revenueData}
                dataKey="ca"
                labelKey="mois"
                type="bar"
              />
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Modes de paiement</h6>
            </Card.Header>
            <Card.Body>
              <TopProductsChart data={paymentData} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Activite recente</h6>
              <Badge bg="secondary">{recentActivities.length}</Badge>
            </Card.Header>
            <Card.Body>
              <div className="activity-list">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="d-flex align-items-start py-3 border-bottom"
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: `${activity.color}15`,
                        color: activity.color,
                        flexShrink: 0,
                      }}
                    >
                      <activity.icon size={18} />
                    </div>
                    <div className="flex-grow-1">
                      <p className="mb-1">{activity.message}</p>
                      <small className="text-muted d-flex align-items-center">
                        <FiClock size={12} className="me-1" />
                        {formatDateTime(activity.time)}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Actions rapides</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button
                  as={Link}
                  to="/ventes/devis/nouveau"
                  variant="outline-primary"
                  className="text-start d-flex align-items-center"
                >
                  <FiFileText className="me-2" />
                  Creer un devis
                </Button>
                <Button
                  as={Link}
                  to="/ventes/factures/nouveau"
                  variant="outline-primary"
                  className="text-start d-flex align-items-center"
                >
                  <FiFileText className="me-2" />
                  Creer une facture
                </Button>
                <Button
                  as={Link}
                  to="/paiements/nouveau"
                  variant="outline-success"
                  className="text-start d-flex align-items-center"
                >
                  <FiCreditCard className="me-2" />
                  Enregistrer un paiement
                </Button>
                <Button
                  as={Link}
                  to="/clients/nouveau"
                  variant="outline-primary"
                  className="text-start d-flex align-items-center"
                >
                  <FiUsers className="me-2" />
                  Ajouter un client
                </Button>
                <Button
                  as={Link}
                  to="/produits/nouveau"
                  variant="outline-primary"
                  className="text-start d-flex align-items-center"
                >
                  <FiPlus className="me-2" />
                  Ajouter un produit
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DashboardPage;
