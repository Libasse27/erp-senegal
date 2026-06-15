import React, { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Link } from 'react-router-dom';
import {
  FiArrowLeft, FiDownload, FiFileText, FiBook, FiBarChart2, FiGrid,
} from 'react-icons/fi';
import usePageTitle from '../../hooks/usePageTitle';
import usePdfActions from '../../hooks/usePdfActions';

const RapportComptablePage = () => {
  usePageTitle('Rapports Comptables', [
    { label: 'Accueil', path: '/' },
    { label: 'Rapports', path: '/rapports' },
    { label: 'Comptables' },
  ]);

  const currentYear = new Date().getFullYear();
  const [dateFrom, setDateFrom] = useState(`${currentYear}-01-01`);
  const [dateTo, setDateTo]     = useState(`${currentYear}-12-31`);

  const { downloadPdf } = usePdfActions();

  const buildParams = () => `dateFrom=${dateFrom}&dateTo=${dateTo}`;

  const exports = [
    {
      group: 'Fichiers FEC & Balance',
      items: [
        {
          label: 'Fichier FEC (Excel)',
          sub: 'Format DGI Sénégal — Fichier des Écritures Comptables',
          icon: FiFileText,
          color: '#059669',
          action: () => downloadPdf(`/comptabilite/fec?${buildParams()}`, `FEC-${currentYear}.xlsx`),
        },
        {
          label: 'Balance Générale (Excel)',
          sub: 'Synthèse débit / crédit / solde par compte',
          icon: FiGrid,
          color: '#1a56db',
          action: () => downloadPdf(`/comptabilite/balance/export?${buildParams()}`, `balance-${currentYear}.xlsx`),
        },
        {
          label: 'Balance Générale (PDF)',
          sub: 'Version imprimable de la balance',
          icon: FiGrid,
          color: '#6366f1',
          action: () => downloadPdf(`/comptabilite/balance/pdf?${buildParams()}`, `balance-${currentYear}.pdf`),
        },
      ],
    },
    {
      group: 'Grand Livre',
      items: [
        {
          label: 'Grand Livre (Excel)',
          sub: 'Détail des écritures par compte comptable',
          icon: FiBook,
          color: '#f59e0b',
          action: () => downloadPdf(`/comptabilite/grand-livre/export?${buildParams()}`, `grand-livre-${currentYear}.xlsx`),
        },
      ],
    },
    {
      group: 'États Financiers SYSCOHADA',
      items: [
        {
          label: 'Compte de Résultat (Excel)',
          sub: 'Charges / Produits — Résultat net SYSCOHADA',
          icon: FiBarChart2,
          color: '#8b5cf6',
          action: () => downloadPdf(`/comptabilite/compte-resultat/export?${buildParams()}`, `resultat-${currentYear}.xlsx`),
        },
        {
          label: 'Compte de Résultat (PDF)',
          sub: 'Version imprimable',
          icon: FiBarChart2,
          color: '#8b5cf6',
          action: () => downloadPdf(`/comptabilite/compte-resultat/pdf?${buildParams()}`, `resultat-${currentYear}.pdf`),
        },
        {
          label: 'Bilan SYSCOHADA (Excel)',
          sub: 'Actif / Passif — Exercice comptable',
          icon: FiBarChart2,
          color: '#0ea5e9',
          action: () => downloadPdf(`/comptabilite/bilan/export?${buildParams()}`, `bilan-${currentYear}.xlsx`),
        },
        {
          label: 'Bilan SYSCOHADA (PDF)',
          sub: 'Version imprimable',
          icon: FiBarChart2,
          color: '#0ea5e9',
          action: () => downloadPdf(`/comptabilite/bilan/pdf?${buildParams()}`, `bilan-${currentYear}.pdf`),
        },
      ],
    },
  ];

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/rapports" className="btn btn-sm btn-outline-secondary"><FiArrowLeft /></Link>
          <div>
            <h1 className="mb-0">Rapports Comptables</h1>
            <small className="text-muted">FEC, Balance, Grand Livre, États financiers SYSCOHADA</small>
          </div>
        </div>
      </div>

      {/* Période */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Label className="small fw-semibold">Date début</Form.Label>
              <Form.Control type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">Date fin</Form.Label>
              <Form.Control type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </Col>
            <Col md="auto">
              <span className="small text-muted">Les téléchargements utiliseront cette période</span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {exports.map((group) => (
        <Card key={group.group} className="shadow-sm mb-4">
          <Card.Header><strong>{group.group}</strong></Card.Header>
          <Card.Body>
            <Row className="g-3">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Col key={item.label} md={6} xl={4}>
                    <div className="border rounded-2 p-3 h-100 d-flex align-items-center gap-3"
                      style={{ backgroundColor: `${item.color}05` }}>
                      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 44, height: 44, backgroundColor: `${item.color}20`, color: item.color }}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold small">{item.label}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.sub}</div>
                      </div>
                      <Button variant="outline-secondary" size="sm" onClick={item.action} title="Télécharger">
                        <FiDownload size={14} />
                      </Button>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card.Body>
        </Card>
      ))}
    </>
  );
};

export default RapportComptablePage;
