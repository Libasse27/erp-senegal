import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import { useGetExercicesQuery, useGetCompteResultatQuery } from '../../redux/api/comptabiliteApi';

const CompteResultatPage = () => {
  usePageTitle('Compte de Resultat', [
    { label: 'Accueil', path: '/' },
    { label: 'Comptabilite' },
    { label: 'Compte de Resultat' },
  ]);

  const [filters, setFilters] = useState({
    exerciceId: '',
    dateDebut: '',
    dateFin: '',
  });

  const { data: exercicesData } = useGetExercicesQuery();
  const { data: resultatData, isLoading, error } = useGetCompteResultatQuery(filters);

  const exercices = exercicesData?.data || [];
  const charges = resultatData?.data?.charges || [];
  const produits = resultatData?.data?.produits || [];
  const totaux = resultatData?.data?.totaux || {
    totalCharges: 0,
    totalProduits: 0,
    resultatNet: 0,
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleExport = () => {
    alert('Fonction d\'export en cours de developpement');
  };

  const getResultatVariant = (resultat) => {
    if (resultat > 0) return 'success';
    if (resultat < 0) return 'danger';
    return 'secondary';
  };

  const getResultatLabel = (resultat) => {
    if (resultat > 0) return 'Benefice';
    if (resultat < 0) return 'Perte';
    return 'Equilibre';
  };

  return (
    <>
      <div className="page-header">
        <h1>Compte de Resultat</h1>
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
                <Form.Label>Exercice</Form.Label>
                <Form.Select
                  name="exerciceId"
                  value={filters.exerciceId}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous les exercices</option>
                  {exercices.map((exercice) => (
                    <option key={exercice._id} value={exercice._id}>
                      {exercice.code} - {exercice.libelle}
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

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Chargement...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">
          Erreur lors du chargement: {error.data?.message || error.message}
        </Alert>
      ) : (
        <>
          <Row className="g-3 mb-3">
            <Col lg={6}>
              <Card className="shadow-sm h-100">
                <Card.Header className="bg-danger text-white">
                  <h6 className="mb-0">CHARGES (Classe 6)</h6>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Numero</th>
                        <th>Libelle</th>
                        <th className="text-end">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {charges.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center text-muted py-3">
                            Aucune charge enregistree
                          </td>
                        </tr>
                      ) : (
                        charges.map((charge) => (
                          <tr key={charge._id}>
                            <td>{charge.numero}</td>
                            <td>{charge.libelle}</td>
                            <td className="text-end">{formatMoney(charge.montant)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <th colSpan="2" className="text-end">
                          Total Charges:
                        </th>
                        <th className="text-end text-danger">
                          {formatMoney(totaux.totalCharges)}
                        </th>
                      </tr>
                    </tfoot>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="shadow-sm h-100">
                <Card.Header className="bg-success text-white">
                  <h6 className="mb-0">PRODUITS (Classe 7)</h6>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Numero</th>
                        <th>Libelle</th>
                        <th className="text-end">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produits.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center text-muted py-3">
                            Aucun produit enregistre
                          </td>
                        </tr>
                      ) : (
                        produits.map((produit) => (
                          <tr key={produit._id}>
                            <td>{produit.numero}</td>
                            <td>{produit.libelle}</td>
                            <td className="text-end">{formatMoney(produit.montant)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <th colSpan="2" className="text-end">
                          Total Produits:
                        </th>
                        <th className="text-end text-success">
                          {formatMoney(totaux.totalProduits)}
                        </th>
                      </tr>
                    </tfoot>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="shadow-sm">
            <Card.Body>
              <Row className="g-3">
                <Col md={4}>
                  <div className="p-3 border rounded">
                    <div className="text-muted small mb-1">Total Charges</div>
                    <div className="fs-5 fw-bold text-danger">
                      {formatMoney(totaux.totalCharges)}
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 border rounded">
                    <div className="text-muted small mb-1">Total Produits</div>
                    <div className="fs-5 fw-bold text-success">
                      {formatMoney(totaux.totalProduits)}
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 border rounded">
                    <div className="text-muted small mb-1 d-flex align-items-center">
                      Resultat Net
                      <Badge bg={getResultatVariant(totaux.resultatNet)} className="ms-2">
                        {getResultatLabel(totaux.resultatNet)}
                      </Badge>
                    </div>
                    <div
                      className={`fs-4 fw-bold ${
                        totaux.resultatNet > 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {formatMoney(Math.abs(totaux.resultatNet))}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </>
      )}
    </>
  );
};

export default CompteResultatPage;
