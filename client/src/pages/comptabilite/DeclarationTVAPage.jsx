import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiPercent, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import { useGetDeclarationTVAQuery } from '../../redux/api/comptabiliteApi';

const DeclarationTVAPage = () => {
  usePageTitle('Déclaration TVA', [
    { label: 'Accueil', path: '/' },
    { label: 'Comptabilite' },
    { label: 'Déclaration TVA' },
  ]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Sélecteur mensuel : mois + année
  const [mois, setMois] = useState(currentMonth);
  const [annee, setAnnee] = useState(currentYear);

  const dateDebut = `${annee}-${String(mois).padStart(2, '0')}-01`;
  const dateFin = new Date(annee, mois, 0).toISOString().split('T')[0]; // dernier jour du mois

  const { data, isLoading, error } = useGetDeclarationTVAQuery({ dateFrom: dateDebut, dateTo: dateFin });

  const tva = data?.data || {};
  const details = tva.details || [];
  const tvaCollectee = tva.tvaCollectee || 0;
  const tvaDeductible = tva.tvaDeductible || 0;
  const tvaADeclarer = tva.tvaADeclarer || 0;
  const creditTVA = tva.creditTVA || 0;

  const hasCredit = creditTVA > 0;
  const hasDebt = tvaADeclarer > 0;

  const moisOptions = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' },
  ];

  const annees = [];
  for (let y = currentYear; y >= currentYear - 5; y--) annees.push(y);

  return (
    <>
      <div className="page-header">
        <div className="d-flex align-items-center gap-2">
          <FiPercent size={24} className="text-primary" />
          <h1 className="mb-0">Déclaration TVA</h1>
        </div>
      </div>

      {/* Filtre période */}
      <Card className="shadow-sm mb-3">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Mois</Form.Label>
                <Form.Select value={mois} onChange={(e) => setMois(Number(e.target.value))}>
                  {moisOptions.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Année</Form.Label>
                <Form.Select value={annee} onChange={(e) => setAnnee(Number(e.target.value))}>
                  {annees.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <div className="p-2 rounded bg-light border text-muted small">
                Période : <strong>{dateDebut}</strong> au <strong>{dateFin}</strong>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Calcul en cours...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">
          <FiAlertCircle className="me-2" />
          Erreur lors du chargement : {error.data?.message || error.message}
        </Alert>
      ) : (
        <>
          {/* KPIs TVA */}
          <Row className="g-3 mb-4">
            <Col xs={12} md={4}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Body>
                  <div className="text-muted small mb-1">TVA Collectée (Ventes)</div>
                  <div className="fs-4 fw-bold text-primary">{formatMoney(tvaCollectee)}</div>
                  <div className="text-muted small">Comptes 443xxx</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Body>
                  <div className="text-muted small mb-1">TVA Déductible (Achats)</div>
                  <div className="fs-4 fw-bold text-success">{formatMoney(tvaDeductible)}</div>
                  <div className="text-muted small">Comptes 445xxx</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card className={`shadow-sm border-0 h-100 ${hasDebt ? 'border-danger' : hasCredit ? 'border-success' : ''}`}
                style={{ borderWidth: hasDebt || hasCredit ? '2px' : '1px', borderStyle: 'solid' }}
              >
                <Card.Body>
                  <div className="text-muted small mb-1 d-flex align-items-center gap-2">
                    {hasDebt ? 'TVA à Payer à la DGI' : hasCredit ? 'Crédit TVA à Reporter' : 'Solde TVA'}
                    {hasDebt && <Badge bg="danger">À PAYER</Badge>}
                    {hasCredit && <Badge bg="success">CRÉDIT</Badge>}
                    {!hasDebt && !hasCredit && tvaCollectee === 0 && <Badge bg="secondary">NANT</Badge>}
                  </div>
                  <div className={`fs-3 fw-bold ${hasDebt ? 'text-danger' : hasCredit ? 'text-success' : 'text-muted'}`}>
                    {formatMoney(hasDebt ? tvaADeclarer : creditTVA)}
                  </div>
                  <div className="text-muted small">
                    {hasDebt
                      ? 'TVA collectée - TVA déductible'
                      : hasCredit
                        ? 'À reporter sur période suivante'
                        : 'Aucun mouvement TVA'}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Alerte si TVA à payer */}
          {hasDebt && (
            <Alert variant="warning" className="d-flex align-items-center mb-4">
              <FiAlertCircle size={20} className="me-2 flex-shrink-0" />
              <div>
                <strong>TVA à déclarer :</strong> {formatMoney(tvaADeclarer)} à reverser à la DGI Sénégal
                au plus tard le <strong>15 du mois suivant</strong> (TVA mensuelle).
              </div>
            </Alert>
          )}

          {hasCredit && (
            <Alert variant="success" className="d-flex align-items-center mb-4">
              <FiCheckCircle size={20} className="me-2 flex-shrink-0" />
              <div>
                <strong>Crédit TVA :</strong> {formatMoney(creditTVA)} à reporter sur la déclaration du mois suivant
                ou à demander en remboursement auprès de la DGI.
              </div>
            </Alert>
          )}

          {/* Détail des comptes TVA */}
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Détail des mouvements TVA</h6>
            </Card.Header>
            <Card.Body className="p-0">
              {details.length === 0 ? (
                <Alert variant="info" className="m-3">
                  Aucun mouvement TVA enregistré pour cette période.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>N° Compte</th>
                        <th>Libellé</th>
                        <th className="text-end">Total Débit</th>
                        <th className="text-end">Total Crédit</th>
                        <th className="text-end">Nature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((row) => {
                        const isCollectee = String(row._id).startsWith('443');
                        return (
                          <tr key={row._id}>
                            <td><strong>{row._id}</strong></td>
                            <td>{row.compteLibelle || '-'}</td>
                            <td className="text-end">{formatMoney(row.totalDebit)}</td>
                            <td className="text-end">{formatMoney(row.totalCredit)}</td>
                            <td className="text-end">
                              <Badge bg={isCollectee ? 'primary' : 'success'}>
                                {isCollectee ? 'Collectée' : 'Déductible'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <th colSpan="2" className="text-end">Synthèse :</th>
                        <th className="text-end text-primary">{formatMoney(tvaCollectee)}</th>
                        <th className="text-end text-success">{formatMoney(tvaDeductible)}</th>
                        <th className={`text-end fw-bold ${hasDebt ? 'text-danger' : 'text-success'}`}>
                          {hasDebt
                            ? `À payer : ${formatMoney(tvaADeclarer)}`
                            : `Crédit : ${formatMoney(creditTVA)}`}
                        </th>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Note légale */}
          <div className="text-muted small mt-3 p-3 bg-light rounded">
            <strong>Note :</strong> La TVA au Sénégal est au taux normal de <strong>18%</strong> (art. 353 CGI).
            La déclaration mensuelle (CA7) doit être déposée avant le <strong>15 du mois suivant</strong> auprès de la DGI.
            Les assujettis au réel normal déposent mensuellement ; le régime simplifié permet une déclaration trimestrielle.
          </div>
        </>
      )}
    </>
  );
};

export default DeclarationTVAPage;
