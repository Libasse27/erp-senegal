import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiDownload, FiPrinter, FiTrendingUp, FiFileText, FiDollarSign } from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import { useGetRapportCAQuery } from '../../redux/api/rapportsApi';
import usePdfActions from '../../hooks/usePdfActions';

const currentYear = new Date().getFullYear();

const CARapportPage = () => {
  usePageTitle('Chiffre d\'Affaires', [
    { label: 'Accueil', path: '/' },
    { label: 'Rapports' },
    { label: "Chiffre d'Affaires" },
  ]);

  const [filters, setFilters] = useState({
    dateFrom: `${currentYear}-01-01`,
    dateTo: `${currentYear}-12-31`,
  });

  const { downloadPdf, printPdf, isLoading: pdfLoading } = usePdfActions();

  const { data, isLoading, error } = useGetRapportCAQuery(filters, {
    skip: !filters.dateFrom || !filters.dateTo,
  });

  const rapport = data?.data?.rapport || { lignes: [], totalHT: 0, totalTVA: 0, totalTTC: 0, nbFacturesTotal: 0 };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const buildPdfPath = () => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    return `/rapports/ca/pdf?${params.toString()}`;
  };

  const handleDownloadPdf = () =>
    downloadPdf(buildPdfPath(), `rapport-ca-${currentYear}.pdf`);
  const handlePrint = () => printPdf(buildPdfPath());

  const tauxTVA =
    rapport.totalHT > 0 ? ((rapport.totalTVA / rapport.totalHT) * 100).toFixed(1) : 0;

  return (
    <>
      <div className="page-header">
        <h1>Chiffre d&apos;Affaires par Periode</h1>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handlePrint}
            disabled={pdfLoading || isLoading}
          >
            {pdfLoading ? (
              <Spinner animation="border" size="sm" className="me-1" />
            ) : (
              <FiPrinter className="me-1" />
            )}
            Imprimer
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={pdfLoading || isLoading}
          >
            {pdfLoading ? (
              <Spinner animation="border" size="sm" className="me-1" />
            ) : (
              <FiDownload className="me-1" />
            )}
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Filtres periode */}
      <Card className="shadow-sm mb-3">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Du</Form.Label>
                <Form.Control
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Au</Form.Label>
                <Form.Control
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      dateFrom: `${currentYear}-01-01`,
                      dateTo: `${currentYear}-12-31`,
                    })
                  }
                >
                  Annee en cours
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    const y = currentYear - 1;
                    setFilters({ dateFrom: `${y}-01-01`, dateTo: `${y}-12-31` });
                  }}
                >
                  Annee precedente
                </Button>
              </div>
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
          Erreur lors du chargement : {error.data?.message || error.message}
        </Alert>
      ) : (
        <>
          {/* KPI cards */}
          <Row className="g-3 mb-3">
            <Col sm={6} xl={3}>
              <Card className="shadow-sm border-0 h-100" style={{ borderLeft: '4px solid #0d6efd' }}>
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted small">Factures emises</div>
                      <div className="fs-4 fw-bold">{rapport.nbFacturesTotal}</div>
                    </div>
                    <FiFileText size={32} className="text-primary opacity-50" />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} xl={3}>
              <Card className="shadow-sm border-0 h-100" style={{ borderLeft: '4px solid #198754' }}>
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted small">CA Hors Taxes</div>
                      <div className="fs-5 fw-bold text-success">{formatMoney(rapport.totalHT)}</div>
                    </div>
                    <FiTrendingUp size={32} className="text-success opacity-50" />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} xl={3}>
              <Card className="shadow-sm border-0 h-100" style={{ borderLeft: '4px solid #ffc107' }}>
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted small">TVA collectee ({tauxTVA}%)</div>
                      <div className="fs-5 fw-bold text-warning">{formatMoney(rapport.totalTVA)}</div>
                    </div>
                    <FiDollarSign size={32} className="text-warning opacity-50" />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} xl={3}>
              <Card className="shadow-sm border-0 h-100" style={{ borderLeft: '4px solid #0dcaf0' }}>
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted small">CA Toutes Taxes</div>
                      <div className="fs-5 fw-bold text-info">{formatMoney(rapport.totalTTC)}</div>
                    </div>
                    <FiDollarSign size={32} className="text-info opacity-50" />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tableau mensuel */}
          <Card className="shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Ventilation mensuelle</h6>
              <span className="text-muted small">
                {rapport.lignes.length} mois avec activite
              </span>
            </Card.Header>
            <Card.Body className="p-0">
              {rapport.lignes.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <FiTrendingUp size={40} className="mb-2 opacity-25" />
                  <p>Aucune facture validee sur cette periode.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Periode</th>
                        <th className="text-end">Nb Factures</th>
                        <th className="text-end">CA HT</th>
                        <th className="text-end">TVA</th>
                        <th className="text-end">CA TTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rapport.lignes.map((ligne, index) => (
                        <tr key={index}>
                          <td>{ligne.label}</td>
                          <td className="text-end">{ligne.nbFactures}</td>
                          <td className="text-end">{formatMoney(ligne.caHT)}</td>
                          <td className="text-end">{formatMoney(ligne.tva)}</td>
                          <td className="text-end fw-semibold">{formatMoney(ligne.caTTC)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot style={{ backgroundColor: '#1a237e', color: '#fff' }}>
                      <tr>
                        <th>TOTAL</th>
                        <th className="text-end">{rapport.nbFacturesTotal}</th>
                        <th className="text-end">{formatMoney(rapport.totalHT)}</th>
                        <th className="text-end">{formatMoney(rapport.totalTVA)}</th>
                        <th className="text-end">{formatMoney(rapport.totalTTC)}</th>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </>
  );
};

export default CARapportPage;
