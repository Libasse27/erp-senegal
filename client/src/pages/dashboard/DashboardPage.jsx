import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import {
  FiDollarSign,
  FiUsers,
  FiFileText,
  FiAlertTriangle,
} from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';

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

const DashboardPage = () => {
  usePageTitle('Tableau de bord', [{ label: 'Accueil', path: '/' }]);

  return (
    <>
      <div className="page-header">
        <h1>Tableau de bord</h1>
      </div>

      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <StatCard
            title="Chiffre d'affaires (mois)"
            value={formatMoney(0)}
            icon={FiDollarSign}
            color="#059669"
            subtitle="Ce mois"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Clients actifs"
            value="0"
            icon={FiUsers}
            color="#1a56db"
            subtitle="Total"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Factures en attente"
            value="0"
            icon={FiFileText}
            color="#d97706"
            subtitle="Non payees"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Alertes stock"
            value="0"
            icon={FiAlertTriangle}
            color="#dc2626"
            subtitle="En rupture"
          />
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Evolution du chiffre d'affaires</h6>
            </Card.Header>
            <Card.Body>
              <div
                className="d-flex justify-content-center align-items-center text-muted"
                style={{ height: 300 }}
              >
                Les graphiques seront affiches ici apres la configuration des donnees.
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Derniere activite</h6>
            </Card.Header>
            <Card.Body>
              <div className="text-muted text-center py-5">Aucune activite recente</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DashboardPage;
