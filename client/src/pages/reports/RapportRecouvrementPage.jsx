import React, { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Accordion from 'react-bootstrap/Accordion';
import { FiAlertTriangle, FiDownload, FiCheckCircle } from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import { useGetRapportRecouvrementQuery } from '../../redux/api/rapportsApi';
import usePdfActions from '../../hooks/usePdfActions';

const BUCKETS_CONFIG = [
  { key: 'current',  label: 'Non échu',       badge: 'success', color: '#059669', desc: 'Factures dont l\'échéance n\'est pas encore dépassée' },
  { key: '1-30',     label: '1 – 30 jours',   badge: 'warning', color: '#d97706', desc: 'Retard de 1 à 30 jours' },
  { key: '31-60',    label: '31 – 60 jours',  badge: 'orange',  color: '#ea580c', desc: 'Retard de 31 à 60 jours' },
  { key: '61-90',    label: '61 – 90 jours',  badge: 'danger',  color: '#dc2626', desc: 'Retard de 61 à 90 jours' },
  { key: '>90',      label: 'Plus de 90 jours', badge: 'dark',  color: '#1e293b', desc: 'Retard supérieur à 90 jours — risque fort de créance irrécouvrable' },
];

const statutColor = (statut) => {
  const map = {
    validee:              'primary',
    envoyee:              'info',
    partiellement_payee:  'warning',
    en_retard:            'danger',
  };
  return map[statut] || 'secondary';
};

const RapportRecouvrementPage = () => {
  usePageTitle('Rapport de Recouvrement', [
    { label: 'Accueil', path: '/' },
    { label: 'Rapports', path: '/rapports' },
    { label: 'Recouvrement' },
  ]);

  const [activeKey, setActiveKey] = useState(null);
  const { downloadPdf, isLoading: pdfLoading } = usePdfActions();

  const { data, isLoading, error, refetch } = useGetRapportRecouvrementQuery();

  const d = data?.data || {};
  const buckets       = d.buckets    || {};
  const totalDu       = d.totalDu    || 0;
  const totalCurrent  = d.totalCurrent || 0;
  const total1_30     = d.total1_30   || 0;
  const total31_60    = d.total31_60  || 0;
  const total61_90    = d.total61_90  || 0;
  const totalPlus90   = d.totalPlus90 || 0;
  const nbCreances    = d.nbCreances  || 0;
  const totalRetard   = d.totalRetard || 0;

  const totauxByKey = {
    current: totalCurrent,
    '1-30':  total1_30,
    '31-60': total31_60,
    '61-90': total61_90,
    '>90':   totalPlus90,
  };

  const handleDownloadPdf = () =>
    downloadPdf('/rapports/recouvrement/pdf', `rapport-recouvrement-${Date.now()}.pdf`);

  return (
    <>
      <div className="page-header">
        <div className="d-flex align-items-center gap-2">
          <FiAlertTriangle size={22} className="text-danger" />
          <h1 className="mb-0">Rapport de Recouvrement</h1>
        </div>
        <Button variant="outline-danger" size="sm" onClick={handleDownloadPdf} disabled={pdfLoading}>
          {pdfLoading
            ? <Spinner animation="border" size="sm" className="me-1" />
            : <FiDownload className="me-1" />}
          Exporter PDF
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Analyse des créances en cours...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">
          <FiAlertTriangle className="me-2" />
          Erreur : {error.data?.message || error.message}
          <Button variant="link" size="sm" onClick={refetch} className="ms-2">Réessayer</Button>
        </Alert>
      ) : (
        <>
          {/* KPIs */}
          <Row className="g-3 mb-4">
            <Col sm={6} lg={3}>
              <Card className="shadow-sm border-0 h-100" style={{ borderLeft: '4px solid #dc2626', borderLeftStyle: 'solid' }}>
                <Card.Body>
                  <div className="text-muted small mb-1">Total Créances Dues</div>
                  <div className="fs-4 fw-bold text-danger">{formatMoney(totalDu)}</div>
                  <div className="text-muted small">{nbCreances} facture{nbCreances !== 1 ? 's' : ''} impayée{nbCreances !== 1 ? 's' : ''}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} lg={3}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Body>
                  <div className="text-muted small mb-1">Non échu (sain)</div>
                  <div className="fs-4 fw-bold text-success">{formatMoney(totalCurrent)}</div>
                  <div className="text-muted small">{(buckets.current || []).length} facture(s)</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} lg={3}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Body>
                  <div className="text-muted small mb-1">Retard 1–30j</div>
                  <div className="fs-4 fw-bold text-warning">{formatMoney(total1_30)}</div>
                  <div className="text-muted small">{(buckets['1-30'] || []).length} facture(s)</div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6} lg={3}>
              <Card className="shadow-sm border-0 h-100" style={{ borderLeft: '3px solid #1e293b' }}>
                <Card.Body>
                  <div className="text-muted small mb-1">Retard &gt; 90j (risque fort)</div>
                  <div className="fs-4 fw-bold">{formatMoney(totalPlus90)}</div>
                  <div className="text-muted small">{(buckets['>90'] || []).length} facture(s)</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Alerte si retard > 30j */}
          {totalRetard > 0 && (
            <Alert variant="danger" className="d-flex align-items-center mb-4">
              <FiAlertTriangle size={20} className="me-2 flex-shrink-0" />
              <div>
                <strong>{formatMoney(totalRetard)}</strong> de créances en retard de plus de 30 jours.
                Recommandation : envoyer des relances formelles et contacter les clients concernés.
              </div>
            </Alert>
          )}

          {nbCreances === 0 && (
            <Alert variant="success" className="d-flex align-items-center">
              <FiCheckCircle size={20} className="me-2" />
              Aucune créance impayée. Toutes les factures sont soldées ou dans les délais.
            </Alert>
          )}

          {/* Tableaux par tranche */}
          <Accordion activeKey={activeKey} onSelect={setActiveKey}>
            {BUCKETS_CONFIG.map((bc, idx) => {
              const lignes = buckets[bc.key] || [];
              const total  = totauxByKey[bc.key] || 0;
              const hasLines = lignes.length > 0;

              return (
                <Accordion.Item key={bc.key} eventKey={String(idx)} className="mb-2 border rounded shadow-sm">
                  <Accordion.Header>
                    <div className="d-flex align-items-center gap-3 w-100 me-3">
                      <Badge bg={bc.badge === 'orange' ? 'warning' : bc.badge} style={bc.badge === 'orange' ? { backgroundColor: bc.color } : {}}>
                        {lignes.length}
                      </Badge>
                      <strong style={{ color: bc.color }}>{bc.label}</strong>
                      <span className="ms-auto fw-bold" style={{ color: bc.color }}>
                        {formatMoney(total)}
                      </span>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="p-0">
                    {!hasLines ? (
                      <div className="text-center text-muted py-3 small">
                        <FiCheckCircle className="me-1" />
                        Aucune créance dans cette tranche
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>N° Facture</th>
                              <th>Client</th>
                              <th className="text-end">Échéance</th>
                              <th className="text-end">Retard (j)</th>
                              <th className="text-end">Total TTC</th>
                              <th className="text-end">Payé</th>
                              <th className="text-end">Reste dû</th>
                              <th className="text-center">Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lignes.map((f) => (
                              <tr key={f._id}>
                                <td className="fw-medium small">{f.numero || '—'}</td>
                                <td className="small">{f.clientNom}</td>
                                <td className="text-end small">{f.dateEcheance ? formatDate(f.dateEcheance) : '—'}</td>
                                <td className="text-end small">
                                  {f.daysOverdue > 0 ? (
                                    <span className="text-danger fw-semibold">+{f.daysOverdue}j</span>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </td>
                                <td className="text-end small">{formatMoney(f.totalTTC)}</td>
                                <td className="text-end small text-success">{formatMoney(f.montantPaye)}</td>
                                <td className="text-end fw-bold small" style={{ color: bc.color }}>
                                  {formatMoney(f.montantDu)}
                                </td>
                                <td className="text-center">
                                  <Badge bg={statutColor(f.statut)} style={{ fontSize: '0.7rem' }}>
                                    {f.statut?.replace(/_/g, ' ')}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="table-light">
                            <tr>
                              <th colSpan="6" className="text-end">Total {bc.label} :</th>
                              <th className="text-end" style={{ color: bc.color }}>{formatMoney(total)}</th>
                              <th />
                            </tr>
                          </tfoot>
                        </Table>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              );
            })}
          </Accordion>

          {/* Synthèse globale */}
          {totalDu > 0 && (
            <Card className="shadow-sm mt-4">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Synthèse par tranche d'âge</h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Tranche</th>
                      <th className="text-center">Nb factures</th>
                      <th className="text-end">Montant dû</th>
                      <th className="text-end">% du total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BUCKETS_CONFIG.map((bc) => {
                      const lignes = buckets[bc.key] || [];
                      const total  = totauxByKey[bc.key] || 0;
                      return (
                        <tr key={bc.key}>
                          <td>
                            <Badge bg={bc.badge === 'orange' ? 'warning' : bc.badge}
                              style={bc.badge === 'orange' ? { backgroundColor: bc.color } : {}}
                              className="me-2"
                            >
                              {bc.label}
                            </Badge>
                          </td>
                          <td className="text-center">{lignes.length}</td>
                          <td className="text-end fw-semibold">{formatMoney(total)}</td>
                          <td className="text-end text-muted">
                            {totalDu > 0 ? Math.round((total / totalDu) * 100) : 0}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot style={{ backgroundColor: '#1a237e', color: '#fff' }}>
                    <tr>
                      <th>TOTAL</th>
                      <th className="text-center">{nbCreances}</th>
                      <th className="text-end">{formatMoney(totalDu)}</th>
                      <th className="text-end">100%</th>
                    </tr>
                  </tfoot>
                </Table>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </>
  );
};

export default RapportRecouvrementPage;
