import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import { useGetPlanComptableQuery, useGetGrandLivreQuery } from '../../redux/api/comptabiliteApi';

const GrandLivrePage = () => {
  usePageTitle('Grand Livre', [
    { label: 'Accueil', path: '/' },
    { label: 'Comptabilite' },
    { label: 'Grand Livre' },
  ]);

  const [filters, setFilters] = useState({
    compteId: '',
    dateDebut: '',
    dateFin: '',
  });

  const { data: planData } = useGetPlanComptableQuery();
  const { data: grandLivreData, isLoading, error } = useGetGrandLivreQuery(filters, {
    skip: !filters.compteId,
  });

  const comptes = planData?.data || [];
  const mouvements = grandLivreData?.data?.mouvements || [];
  const selectedCompte = grandLivreData?.data?.compte;
  const totaux = grandLivreData?.data?.totaux || { debit: 0, credit: 0, solde: 0 };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getSoldeColor = (solde) => {
    if (solde > 0) return 'text-success';
    if (solde < 0) return 'text-danger';
    return 'text-muted';
  };

  const handleExport = () => {
    alert('Fonction d\'export en cours de developpement');
  };

  return (
    <>
      <div className="page-header">
        <h1>Grand Livre</h1>
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
                <Form.Label>
                  Compte <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="compteId"
                  value={filters.compteId}
                  onChange={handleFilterChange}
                  required
                >
                  <option value="">Selectionnez un compte...</option>
                  {comptes.map((compte) => (
                    <option key={compte._id} value={compte._id}>
                      {compte.numero} - {compte.libelle}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
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
          </Row>
        </Card.Body>
      </Card>

      {!filters.compteId ? (
        <Alert variant="info">
          Veuillez selectionner un compte pour afficher le grand livre.
        </Alert>
      ) : (
        <Card className="shadow-sm">
          <Card.Header className="bg-white">
            <h6 className="mb-0">
              {selectedCompte && `${selectedCompte.numero} - ${selectedCompte.libelle}`}
            </h6>
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
            ) : mouvements.length === 0 ? (
              <Alert variant="info">
                Aucun mouvement trouve pour ce compte et cette periode.
              </Alert>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Piece</th>
                        <th>Journal</th>
                        <th>Libelle</th>
                        <th className="text-end">Debit</th>
                        <th className="text-end">Credit</th>
                        <th className="text-end">Solde Progressif</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mouvements.map((mouvement, index) => (
                        <tr key={index}>
                          <td>{formatDate(mouvement.date)}</td>
                          <td>{mouvement.numeroPiece || '-'}</td>
                          <td>{mouvement.journal || '-'}</td>
                          <td>{mouvement.libelle}</td>
                          <td className="text-end">
                            {mouvement.debit > 0 ? formatMoney(mouvement.debit) : '-'}
                          </td>
                          <td className="text-end">
                            {mouvement.credit > 0 ? formatMoney(mouvement.credit) : '-'}
                          </td>
                          <td className={`text-end fw-bold ${getSoldeColor(mouvement.soldeProgressif)}`}>
                            {formatMoney(mouvement.soldeProgressif)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <th colSpan="4" className="text-end">
                          Totaux:
                        </th>
                        <th className="text-end">{formatMoney(totaux.debit)}</th>
                        <th className="text-end">{formatMoney(totaux.credit)}</th>
                        <th className={`text-end ${getSoldeColor(totaux.solde)}`}>
                          {formatMoney(totaux.solde)}
                        </th>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      )}
    </>
  );
};

export default GrandLivrePage;
