import React, { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import ProgressBar from 'react-bootstrap/ProgressBar';
import {
  FiDollarSign,
  FiShoppingCart,
  FiTrendingUp,
  FiUsers,
  FiPackage,
  FiDownload,
  FiPrinter,
} from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import StatCard from '../../components/ui/StatCard';
import { SalesEvolutionChart } from '../../components/charts';
import {
  useGetRapportCAQuery,
  useGetRapportTopClientsQuery,
  useGetRapportTopProduitsQuery,
} from '../../redux/api/rapportsApi';
import usePdfActions from '../../hooks/usePdfActions';

const currentYear = new Date().getFullYear();

const SalesReportPage = () => {
  usePageTitle('Rapport Ventes', [
    { label: 'Accueil', path: '/' },
    { label: 'Rapports', path: '/rapports' },
    { label: 'Ventes' },
  ]);

  const [filters, setFilters] = useState({
    dateFrom: `${currentYear}-01-01`,
    dateTo: `${currentYear}-12-31`,
  });

  const { downloadPdf, printPdf, isLoading: pdfLoading } = usePdfActions();

  const { data: caData, isLoading: isLoadingCA, error: errorCA } = useGetRapportCAQuery(filters, {
    skip: !filters.dateFrom || !filters.dateTo,
  });
  const { data: clientsData, isLoading: isLoadingClients } = useGetRapportTopClientsQuery(
    { ...filters, limit: 10 },
    { skip: !filters.dateFrom || !filters.dateTo }
  );
  const { data: produitsData, isLoading: isLoadingProduits } = useGetRapportTopProduitsQuery(
    { ...filters, limit: 10 },
    { skip: !filters.dateFrom || !filters.dateTo }
  );

  const rapport   = caData?.data?.rapport   || { lignes: [], totalHT: 0, totalTVA: 0, totalTTC: 0, nbFacturesTotal: 0 };
  const clients   = clientsData?.data?.clients   || [];
  const produits  = produitsData?.data?.produits  || [];

  const panierMoyen = rapport.nbFacturesTotal > 0
    ? Math.round(rapport.totalTTC / rapport.nbFacturesTotal)
    : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const buildPdfParams = () => {
    const p = new URLSearchParams();
    if (filters.dateFrom) p.set('dateFrom', filters.dateFrom);
    if (filters.dateTo)   p.set('dateTo',   filters.dateTo);
    return p.toString();
  };

  const handleDownloadPdf = () =>
    downloadPdf(`/rapports/ca/pdf?${buildPdfParams()}`, `rapport-ventes-${currentYear}.pdf`);
  const handlePrint = () =>
    printPdf(`/rapports/ca/pdf?${buildPdfParams()}`);

  const isLoading = isLoadingCA || isLoadingClients || isLoadingProduits;

  const chartData = rapport.lignes.map((l) => ({ mois: l.label, ca: l.caTTC }));

  return (
    <>
      <div className="page-header">
        <h1>Rapport des Ventes</h1>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={handlePrint} disabled={pdfLoading || isLoading}>
            {pdfLoading ? <Spinner animation="border" size="sm" className="me-1" /> : <FiPrinter className="me-1" />}
            Imprimer
          </Button>
          <Button variant="outline-primary" size="sm" onClick={handleDownloadPdf} disabled={pdfLoading || isLoading}>
            {pdfLoading ? <Spinner animation="border" size="sm" className="me-1" /> : <FiDownload className="me-1" />}
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Filtres période */}
      <Card className="shadow-sm mb-3">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Du</Form.Label>
                <Form.Control type="date" name="dateFrom" value={filters.dateFrom} onChange={handleChange} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Au</Form.Label>
                <Form.Control type="date" name="dateTo" value={filters.dateTo} onChange={handleChange} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setFilters({ dateFrom: `${currentYear}-01-01`, dateTo: `${currentYear}-12-31` })}
                >
                  Année en cours
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    const y = currentYear - 1;
                    setFilters({ dateFrom: `${y}-01-01`, dateTo: `${y}-12-31` });
                  }}
                >
                  Année préc.
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    const m = String(now.getMonth() + 1).padStart(2, '0');
                    const y = now.getFullYear();
                    const last = new Date(y, now.getMonth() + 1, 0).getDate();
                    setFilters({ dateFrom: `${y}-${m}-01`, dateTo: `${y}-${m}-${last}` });
                  }}
                >
                  Ce mois
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {errorCA && (
        <Alert variant="danger">Erreur lors du chargement : {errorCA.data?.message || errorCA.message}</Alert>
      )}

      {/* KPIs */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <StatCard
            title="CA TTC"
            value={isLoadingCA ? '…' : formatMoney(rapport.totalTTC)}
            icon={FiDollarSign}
            color="#059669"
            subtitle="Toutes taxes comprises"
            loading={isLoadingCA}
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Factures émises"
            value={isLoadingCA ? '…' : rapport.nbFacturesTotal}
            icon={FiShoppingCart}
            color="#1a56db"
            subtitle="Documents validés"
            loading={isLoadingCA}
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="Panier moyen"
            value={isLoadingCA ? '…' : formatMoney(panierMoyen)}
            icon={FiTrendingUp}
            color="#d97706"
            subtitle="Par facture TTC"
            loading={isLoadingCA}
          />
        </Col>
        <Col sm={6} xl={3}>
          <StatCard
            title="CA HT"
            value={isLoadingCA ? '…' : formatMoney(rapport.totalHT)}
            icon={FiDollarSign}
            color="#7c3aed"
            subtitle={`TVA : ${formatMoney(rapport.totalTVA)}`}
            loading={isLoadingCA}
          />
        </Col>
      </Row>

      {/* Graphique CA mensuel */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Évolution du CA mensuel</h6>
          {isLoadingCA && <Spinner animation="border" size="sm" />}
        </Card.Header>
        <Card.Body>
          {chartData.length === 0 && !isLoadingCA ? (
            <p className="text-muted text-center py-4 mb-0">Aucune facture sur cette période</p>
          ) : (
            <SalesEvolutionChart data={chartData} dataKey="ca" labelKey="mois" type="bar" />
          )}
        </Card.Body>
      </Card>

      {/* Top clients + Top produits */}
      <Row className="g-3">
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0 d-flex align-items-center gap-2">
                <FiUsers size={16} className="text-primary" />
                Top clients par CA
              </h6>
              {isLoadingClients
                ? <Spinner animation="border" size="sm" />
                : <Badge bg="primary">{clients.length}</Badge>
              }
            </Card.Header>
            <Card.Body className="p-0">
              {clients.length === 0 && !isLoadingClients ? (
                <p className="text-muted text-center py-4 mb-0">Aucun client sur cette période</p>
              ) : (
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Client</th>
                      <th className="text-end">CA TTC</th>
                      <th className="text-center">Factures</th>
                      <th className="text-center">Payé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c, i) => (
                      <tr key={c.clientId || i}>
                        <td className="text-muted small">{i + 1}</td>
                        <td>
                          <div className="fw-medium small">{c.displayName}</div>
                          <ProgressBar
                            now={c.pct}
                            variant="primary"
                            style={{ height: 3, marginTop: 3 }}
                          />
                        </td>
                        <td className="text-end fw-semibold text-success small">
                          {formatMoney(c.totalCA)}
                        </td>
                        <td className="text-center">
                          <Badge bg="secondary">{c.nbFactures}</Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg={c.tauxPaiement >= 90 ? 'success' : c.tauxPaiement >= 50 ? 'warning' : 'danger'}>
                            {c.tauxPaiement}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0 d-flex align-items-center gap-2">
                <FiPackage size={16} className="text-warning" />
                Top produits par CA
              </h6>
              {isLoadingProduits
                ? <Spinner animation="border" size="sm" />
                : <Badge bg="warning" text="dark">{produits.length}</Badge>
              }
            </Card.Header>
            <Card.Body className="p-0">
              {produits.length === 0 && !isLoadingProduits ? (
                <p className="text-muted text-center py-4 mb-0">Aucun produit sur cette période</p>
              ) : (
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Produit / Service</th>
                      <th className="text-end">Qté</th>
                      <th className="text-end">CA TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produits.map((p, i) => (
                      <tr key={p.productId || i}>
                        <td className="text-muted small">{i + 1}</td>
                        <td>
                          <div className="fw-medium small text-truncate" style={{ maxWidth: 200 }} title={p.designation}>
                            {p.designation}
                          </div>
                          <ProgressBar
                            now={p.pct}
                            variant="warning"
                            style={{ height: 3, marginTop: 3 }}
                          />
                        </td>
                        <td className="text-end text-muted small">{p.totalQte}</td>
                        <td className="text-end fw-semibold small">{formatMoney(p.totalCA)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Ventilation mensuelle CA */}
      {rapport.lignes.length > 0 && (
        <Card className="shadow-sm mt-4">
          <Card.Header className="bg-white">
            <h6 className="mb-0">Ventilation mensuelle</h6>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Période</th>
                    <th className="text-end">Nb Factures</th>
                    <th className="text-end">CA HT</th>
                    <th className="text-end">TVA</th>
                    <th className="text-end">CA TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {rapport.lignes.map((ligne, idx) => (
                    <tr key={idx}>
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
          </Card.Body>
        </Card>
      )}
    </>
  );
};

export default SalesReportPage;
