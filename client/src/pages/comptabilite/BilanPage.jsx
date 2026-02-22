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
import { useGetExercicesQuery, useGetBilanQuery } from '../../redux/api/comptabiliteApi';

const BilanPage = () => {
  usePageTitle('Bilan', [
    { label: 'Accueil', path: '/' },
    { label: 'Comptabilite' },
    { label: 'Bilan' },
  ]);

  const [filters, setFilters] = useState({
    date: '',
    exerciceId: '',
  });

  const { data: exercicesData } = useGetExercicesQuery();
  const { data: bilanData, isLoading, error } = useGetBilanQuery(filters);

  const exercices = exercicesData?.data || [];
  const actif = bilanData?.data?.actif || {
    actifImmobilise: [],
    actifCirculant: [],
    totalActifImmobilise: 0,
    totalActifCirculant: 0,
    totalActif: 0,
  };
  const passif = bilanData?.data?.passif || {
    capitauxPropres: [],
    dettes: [],
    totalCapitauxPropres: 0,
    totalDettes: 0,
    totalPassif: 0,
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleExport = () => {
    alert('Fonction d\'export en cours de developpement');
  };

  const isBalanced = Math.abs(actif.totalActif - passif.totalPassif) < 1;

  return (
    <>
      <div className="page-header">
        <h1>Bilan</h1>
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
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date (Au)</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
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
          </Row>
        </Card.Body>
      </Card>

      {!isBalanced && actif.totalActif > 0 && (
        <Alert variant="warning" className="d-flex align-items-center">
          <FiAlertCircle className="me-2" size={20} />
          <div>
            <strong>Attention:</strong> Le bilan n'est pas equilibre. Total Actif:{' '}
            {formatMoney(actif.totalActif)}, Total Passif: {formatMoney(passif.totalPassif)}
          </div>
        </Alert>
      )}

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
        <Row className="g-3">
          <Col lg={6}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-primary text-white">
                <h6 className="mb-0">ACTIF</h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Poste</th>
                      <th className="text-end">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="table-secondary">
                      <td colSpan="2">
                        <strong>ACTIF IMMOBILISE (Classe 2)</strong>
                      </td>
                    </tr>
                    {actif.actifImmobilise.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="text-center text-muted py-2">
                          Aucune immobilisation
                        </td>
                      </tr>
                    ) : (
                      actif.actifImmobilise.map((item, index) => (
                        <tr key={index}>
                          <td className="ps-4">{item.libelle}</td>
                          <td className="text-end">{formatMoney(item.montant)}</td>
                        </tr>
                      ))
                    )}
                    <tr className="table-light">
                      <td>
                        <strong>Total Actif Immobilise</strong>
                      </td>
                      <td className="text-end">
                        <strong>{formatMoney(actif.totalActifImmobilise)}</strong>
                      </td>
                    </tr>
                    <tr className="table-secondary">
                      <td colSpan="2">
                        <strong>ACTIF CIRCULANT (Classes 3, 4, 5)</strong>
                      </td>
                    </tr>
                    {actif.actifCirculant.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="text-center text-muted py-2">
                          Aucun actif circulant
                        </td>
                      </tr>
                    ) : (
                      actif.actifCirculant.map((item, index) => (
                        <tr key={index}>
                          <td className="ps-4">{item.libelle}</td>
                          <td className="text-end">{formatMoney(item.montant)}</td>
                        </tr>
                      ))
                    )}
                    <tr className="table-light">
                      <td>
                        <strong>Total Actif Circulant</strong>
                      </td>
                      <td className="text-end">
                        <strong>{formatMoney(actif.totalActifCirculant)}</strong>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="table-primary text-white">
                    <tr>
                      <th>TOTAL ACTIF</th>
                      <th className="text-end">{formatMoney(actif.totalActif)}</th>
                    </tr>
                  </tfoot>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-success text-white">
                <h6 className="mb-0">PASSIF</h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Poste</th>
                      <th className="text-end">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="table-secondary">
                      <td colSpan="2">
                        <strong>CAPITAUX PROPRES (Classe 1)</strong>
                      </td>
                    </tr>
                    {passif.capitauxPropres.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="text-center text-muted py-2">
                          Aucun capital
                        </td>
                      </tr>
                    ) : (
                      passif.capitauxPropres.map((item, index) => (
                        <tr key={index}>
                          <td className="ps-4">{item.libelle}</td>
                          <td className="text-end">{formatMoney(item.montant)}</td>
                        </tr>
                      ))
                    )}
                    <tr className="table-light">
                      <td>
                        <strong>Total Capitaux Propres</strong>
                      </td>
                      <td className="text-end">
                        <strong>{formatMoney(passif.totalCapitauxPropres)}</strong>
                      </td>
                    </tr>
                    <tr className="table-secondary">
                      <td colSpan="2">
                        <strong>DETTES (Classes 4, 5 credit)</strong>
                      </td>
                    </tr>
                    {passif.dettes.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="text-center text-muted py-2">
                          Aucune dette
                        </td>
                      </tr>
                    ) : (
                      passif.dettes.map((item, index) => (
                        <tr key={index}>
                          <td className="ps-4">{item.libelle}</td>
                          <td className="text-end">{formatMoney(item.montant)}</td>
                        </tr>
                      ))
                    )}
                    <tr className="table-light">
                      <td>
                        <strong>Total Dettes</strong>
                      </td>
                      <td className="text-end">
                        <strong>{formatMoney(passif.totalDettes)}</strong>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="table-success text-white">
                    <tr>
                      <th>TOTAL PASSIF</th>
                      <th className="text-end">{formatMoney(passif.totalPassif)}</th>
                    </tr>
                  </tfoot>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
};

export default BilanPage;
