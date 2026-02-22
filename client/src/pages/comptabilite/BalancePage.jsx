import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiPrinter, FiDownload, FiAlertCircle } from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import { useGetBalanceQuery } from '../../redux/api/comptabiliteApi';

const BalancePage = () => {
  usePageTitle('Balance Generale', [
    { label: 'Accueil', path: '/' },
    { label: 'Comptabilite' },
    { label: 'Balance' },
  ]);

  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    classe: '',
  });

  const { data: balanceData, isLoading, error } = useGetBalanceQuery(filters);

  const comptes = balanceData?.data?.comptes || [];
  const totaux = balanceData?.data?.totaux || {
    totalDebit: 0,
    totalCredit: 0,
    totalSoldeDebiteur: 0,
    totalSoldeCrediteur: 0,
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleExport = () => {
    alert('Fonction d\'export en cours de developpement');
  };

  const getClasseLabel = (classe) => {
    const labels = {
      1: 'Classe 1 - Comptes de capitaux',
      2: 'Classe 2 - Comptes d\'immobilisations',
      3: 'Classe 3 - Comptes de stocks',
      4: 'Classe 4 - Comptes de tiers',
      5: 'Classe 5 - Comptes de tresorerie',
      6: 'Classe 6 - Comptes de charges',
      7: 'Classe 7 - Comptes de produits',
      8: 'Classe 8 - Comptes speciaux',
    };
    return labels[classe] || `Classe ${classe}`;
  };

  const groupedComptes = comptes.reduce((acc, compte) => {
    const classe = compte.numero.charAt(0);
    if (!acc[classe]) {
      acc[classe] = [];
    }
    acc[classe].push(compte);
    return acc;
  }, {});

  const isBalanced = Math.abs(totaux.totalDebit - totaux.totalCredit) < 1;

  return (
    <>
      <div className="page-header">
        <h1>Balance Generale</h1>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={handleExport}>
            <FiPrinter className="me-1" />
            Imprimer
          </Button>
          <Button variant="outline-primary" size="sm" onClick={handleExport}>
            <FiDownload className="me-1" />
            Exporter PDF
          </Button>
        </div>
      </div>

      <Card className="shadow-sm mb-3">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Date de debut</Form.Label>
                <Form.Control
                  type="date"
                  name="dateDebut"
                  value={filters.dateDebut}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Date de fin</Form.Label>
                <Form.Control
                  type="date"
                  name="dateFin"
                  value={filters.dateFin}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Classe (optionnel)</Form.Label>
                <Form.Select name="classe" value={filters.classe} onChange={handleFilterChange}>
                  <option value="">Toutes les classes</option>
                  <option value="1">Classe 1 - Capitaux</option>
                  <option value="2">Classe 2 - Immobilisations</option>
                  <option value="3">Classe 3 - Stocks</option>
                  <option value="4">Classe 4 - Tiers</option>
                  <option value="5">Classe 5 - Tresorerie</option>
                  <option value="6">Classe 6 - Charges</option>
                  <option value="7">Classe 7 - Produits</option>
                  <option value="8">Classe 8 - Comptes speciaux</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {!isBalanced && comptes.length > 0 && (
        <Alert variant="warning" className="d-flex align-items-center">
          <FiAlertCircle className="me-2" size={20} />
          <div>
            <strong>Attention:</strong> La balance n'est pas equilibree. Total Debit:{' '}
            {formatMoney(totaux.totalDebit)}, Total Credit: {formatMoney(totaux.totalCredit)}
          </div>
        </Alert>
      )}

      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h6 className="mb-0">Balance des Comptes</h6>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Chargement...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              Erreur lors du chargement: {error.data?.message || error.message}
            </Alert>
          ) : comptes.length === 0 ? (
            <Alert variant="info">
              Aucun compte trouve pour cette periode.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Numero Compte</th>
                    <th>Libelle</th>
                    <th className="text-end">Total Debit</th>
                    <th className="text-end">Total Credit</th>
                    <th className="text-end">Solde Debiteur</th>
                    <th className="text-end">Solde Crediteur</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(groupedComptes)
                    .sort()
                    .map((classe) => {
                      const comptesClasse = groupedComptes[classe];
                      const subtotaux = comptesClasse.reduce(
                        (acc, compte) => ({
                          debit: acc.debit + compte.totalDebit,
                          credit: acc.credit + compte.totalCredit,
                          soldeDebiteur: acc.soldeDebiteur + compte.soldeDebiteur,
                          soldeCrediteur: acc.soldeCrediteur + compte.soldeCrediteur,
                        }),
                        { debit: 0, credit: 0, soldeDebiteur: 0, soldeCrediteur: 0 }
                      );

                      return (
                        <React.Fragment key={classe}>
                          <tr className="table-secondary">
                            <td colSpan="6">
                              <strong>{getClasseLabel(classe)}</strong>
                            </td>
                          </tr>
                          {comptesClasse.map((compte) => (
                            <tr key={compte._id}>
                              <td>{compte.numero}</td>
                              <td>{compte.libelle}</td>
                              <td className="text-end">{formatMoney(compte.totalDebit)}</td>
                              <td className="text-end">{formatMoney(compte.totalCredit)}</td>
                              <td className="text-end">
                                {compte.soldeDebiteur > 0 ? formatMoney(compte.soldeDebiteur) : '-'}
                              </td>
                              <td className="text-end">
                                {compte.soldeCrediteur > 0 ? formatMoney(compte.soldeCrediteur) : '-'}
                              </td>
                            </tr>
                          ))}
                          <tr className="table-light">
                            <td colSpan="2" className="text-end">
                              <strong>Sous-total {getClasseLabel(classe)}:</strong>
                            </td>
                            <td className="text-end">
                              <strong>{formatMoney(subtotaux.debit)}</strong>
                            </td>
                            <td className="text-end">
                              <strong>{formatMoney(subtotaux.credit)}</strong>
                            </td>
                            <td className="text-end">
                              <strong>{formatMoney(subtotaux.soldeDebiteur)}</strong>
                            </td>
                            <td className="text-end">
                              <strong>{formatMoney(subtotaux.soldeCrediteur)}</strong>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                </tbody>
                <tfoot className="table-dark">
                  <tr>
                    <th colSpan="2" className="text-end">
                      TOTAUX GENERAUX:
                    </th>
                    <th className="text-end">{formatMoney(totaux.totalDebit)}</th>
                    <th className="text-end">{formatMoney(totaux.totalCredit)}</th>
                    <th className="text-end">{formatMoney(totaux.totalSoldeDebiteur)}</th>
                    <th className="text-end">{formatMoney(totaux.totalSoldeCrediteur)}</th>
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

export default BalancePage;
