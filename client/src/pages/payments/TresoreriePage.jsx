import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiDollarSign, FiCreditCard, FiSmartphone, FiTrendingUp } from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import { useGetBankAccountsQuery } from '../../redux/api/bankAccountsApi';

const StatCard = ({ title, value, icon: Icon, color, loading }) => (
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
        {loading ? <Spinner size="sm" /> : <Icon size={24} />}
      </div>
      <div>
        <div className="stat-label">{title}</div>
        <div className="stat-value" style={{ color }}>
          {loading ? '...' : value}
        </div>
      </div>
    </Card.Body>
  </Card>
);

const TresoreriePage = () => {
  usePageTitle('Tresorerie', [
    { label: 'Accueil', path: '/' },
    { label: 'Paiements' },
    { label: 'Tresorerie' },
  ]);

  const navigate = useNavigate();
  const { data, isLoading, error } = useGetBankAccountsQuery();

  const accounts = data?.data || [];

  const totalBank = accounts
    .filter((acc) => acc.type === 'courant' || acc.type === 'epargne')
    .reduce((sum, acc) => sum + (acc.soldeActuel || 0), 0);

  const totalMobileMoney = accounts
    .filter((acc) => acc.type === 'mobile_money')
    .reduce((sum, acc) => sum + (acc.soldeActuel || 0), 0);

  const totalCash = accounts
    .filter((acc) => acc.type === 'caisse')
    .reduce((sum, acc) => sum + (acc.soldeActuel || 0), 0);

  const totalTresorerie = totalBank + totalMobileMoney + totalCash;

  const getTypeBadgeVariant = (type) => {
    switch (type) {
      case 'courant':
        return 'primary';
      case 'epargne':
        return 'info';
      case 'mobile_money':
        return 'warning';
      case 'caisse':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'courant':
        return 'Compte Courant';
      case 'epargne':
        return 'Epargne';
      case 'mobile_money':
        return 'Mobile Money';
      case 'caisse':
        return 'Caisse';
      default:
        return type;
    }
  };

  const getSoldeColor = (solde) => {
    if (solde > 0) return 'text-success';
    if (solde < 0) return 'text-danger';
    return 'text-muted';
  };

  return (
    <>
      <div className="page-header">
        <h1>Tresorerie</h1>
      </div>

      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <StatCard
            title="Solde Bancaire"
            value={formatMoney(totalBank)}
            icon={FiDollarSign}
            color="#1a56db"
            loading={isLoading}
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Mobile Money"
            value={formatMoney(totalMobileMoney)}
            icon={FiSmartphone}
            color="#ff6900"
            loading={isLoading}
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Caisse"
            value={formatMoney(totalCash)}
            icon={FiCreditCard}
            color="#059669"
            loading={isLoading}
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatCard
            title="Tresorerie Totale"
            value={formatMoney(totalTresorerie)}
            icon={FiTrendingUp}
            color="#d97706"
            loading={isLoading}
          />
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h6 className="mb-0">Comptes et Soldes</h6>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Chargement...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              Erreur lors du chargement des comptes: {error.data?.message || error.message}
            </Alert>
          ) : accounts.length === 0 ? (
            <Alert variant="info">
              Aucun compte bancaire trouve. Veuillez configurer vos comptes bancaires.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Nom</th>
                    <th>Banque</th>
                    <th>Type</th>
                    <th className="text-end">Solde Actuel</th>
                    <th className="text-center">Par Defaut</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr
                      key={account._id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/comptes-bancaires`)}
                    >
                      <td>
                        <strong>{account.nom}</strong>
                      </td>
                      <td>{account.banque || '-'}</td>
                      <td>
                        <Badge bg={getTypeBadgeVariant(account.type)}>
                          {getTypeLabel(account.type)}
                        </Badge>
                      </td>
                      <td className={`text-end fw-bold ${getSoldeColor(account.soldeActuel)}`}>
                        {formatMoney(account.soldeActuel || 0)}
                      </td>
                      <td className="text-center">
                        {account.isDefault && <Badge bg="success">Oui</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <th colSpan="3" className="text-end">
                      Total Tresorerie:
                    </th>
                    <th className={`text-end fw-bold ${getSoldeColor(totalTresorerie)}`}>
                      {formatMoney(totalTresorerie)}
                    </th>
                    <th></th>
                  </tr>
                </tfoot>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default TresoreriePage;
