import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiDownload } from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import { useGetPlanComptableQuery, useGetGrandLivreQuery } from '../../redux/api/comptabiliteApi';
import usePdfActions from '../../hooks/usePdfActions';

const GrandLivrePage = () => {
  usePageTitle('Grand Livre', [
    { label: 'Accueil', path: '/' },
    { label: 'Comptabilite' },
    { label: 'Grand Livre' },
  ]);

  const [filters, setFilters] = useState({
    compteNumero: '',
    dateDebut: '',
    dateFin: '',
  });

  const { downloadPdf, isLoading: pdfLoading } = usePdfActions();

  const { data: planData } = useGetPlanComptableQuery();
  const { data: grandLivreData, isLoading, error } = useGetGrandLivreQuery(
    {
      compteNumero: filters.compteNumero,
      dateFrom: filters.dateDebut,
      dateTo: filters.dateFin,
    },
    { skip: !filters.compteNumero }
  );

  const comptes = planData?.data || [];
  const mouvements = grandLivreData?.data?.mouvements || [];
  const selectedCompte = grandLivreData?.data?.compte;
  const totaux = grandLivreData?.data || { totalDebit: 0, totalCredit: 0, solde: 0 };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const buildExportPath = () => {
    const params = new URLSearchParams({ compteNumero: filters.compteNumero });
    if (filters.dateDebut) params.set('dateFrom', filters.dateDebut);
    if (filters.dateFin) params.set('dateTo', filters.dateFin);
    return `/comptabilite/grand-livre/export?${params.toString()}`;
  };

  const handleExportExcel = () =>
    downloadPdf(buildExportPath(), `grand-livre-${filters.compteNumero}-${Date.now()}.xlsx`);

  const getSoldeColor = (solde) => {
    if (solde > 0) return 'text-success';
    if (solde < 0) return 'text-danger';
    return 'text-muted';
  };

  const selectedCompteLabel = comptes.find((c) => c.numero === filters.compteNumero);

  return (
    <>
      <div className="page-header">
        <h1>Grand Livre</h1>
        {filters.compteNumero && (
          <Button
            variant="outline-success"
            size="sm"
            onClick={handleExportExcel}
            disabled={pdfLoading || mouvements.length === 0}
          >
            {pdfLoading ? (
              <Spinner animation="border" size="sm" className="me-1" />
            ) : (
              <FiDownload className="me-1" />
            )}
            Exporter Excel
          </Button>
        )}
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
                  name="compteNumero"
                  value={filters.compteNumero}
                  onChange={handleFilterChange}
                >
                  <option value="">Selectionnez un compte...</option>
                  {comptes.map((compte) => (
                    <option key={compte._id} value={compte.numero}>
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

      {!filters.compteNumero ? (
        <Alert variant="info">
          Veuillez selectionner un compte pour afficher le grand livre.
        </Alert>
      ) : (
        <Card className="shadow-sm">
          <Card.Header className="bg-white">
            <h6 className="mb-0">
              {selectedCompteLabel
                ? `${selectedCompteLabel.numero} - ${selectedCompteLabel.libelle}`
                : selectedCompte
                  ? `${selectedCompte.numero} - ${selectedCompte.libelle}`
                  : filters.compteNumero}
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
                Erreur lors du chargement : {error.data?.message || error.message}
              </Alert>
            ) : mouvements.length === 0 ? (
              <Alert variant="info">
                Aucun mouvement trouve pour ce compte et cette periode.
              </Alert>
            ) : (
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
                        <td>{mouvement.numeroPiece || mouvement.reference || '-'}</td>
                        <td>{mouvement.journal || '-'}</td>
                        <td>{mouvement.libelle}</td>
                        <td className="text-end">
                          {mouvement.debit > 0 ? formatMoney(mouvement.debit) : '-'}
                        </td>
                        <td className="text-end">
                          {mouvement.credit > 0 ? formatMoney(mouvement.credit) : '-'}
                        </td>
                        <td className={`text-end fw-bold ${getSoldeColor(mouvement.soldeProgressif ?? mouvement.solde)}`}>
                          {formatMoney(mouvement.soldeProgressif ?? mouvement.solde)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <th colSpan="4" className="text-end">Totaux :</th>
                      <th className="text-end">{formatMoney(totaux.totalDebit)}</th>
                      <th className="text-end">{formatMoney(totaux.totalCredit)}</th>
                      <th className={`text-end ${getSoldeColor(totaux.solde)}`}>
                        {formatMoney(totaux.solde)}
                      </th>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </>
  );
};

export default GrandLivrePage;
