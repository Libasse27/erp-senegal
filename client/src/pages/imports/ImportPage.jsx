import React, { useState, useRef } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { FiUpload, FiDownload, FiCheckCircle, FiAlertTriangle, FiX, FiFile } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import useExcelDownload from '../../hooks/useExcelDownload';
import { useImportDataMutation } from '../../redux/api/importApi';

const IMPORT_TYPES = [
  {
    value: 'clients',
    label: 'Clients',
    description: 'Importer votre liste de clients (particuliers et professionnels)',
    fields: 'Type, Raison Sociale, Prénom, Email, Téléphone, NINEA, Ville, Adresse',
    color: '#1a56db',
  },
  {
    value: 'fournisseurs',
    label: 'Fournisseurs',
    description: 'Importer votre liste de fournisseurs',
    fields: 'Raison Sociale, Email, Téléphone, NINEA, RCCM, Ville, Adresse, Délai paiement',
    color: '#7c3aed',
  },
  {
    value: 'produits',
    label: 'Produits',
    description: 'Importer votre catalogue produits',
    fields: 'Référence, Nom, Catégorie, Prix Achat, Prix Vente, TVA, Stock Min, Unité',
    color: '#059669',
  },
];

const ImportPage = () => {
  usePageTitle('Import / Export', [
    { label: 'Accueil', path: '/' },
    { label: 'Import / Export', path: '/imports' },
  ]);

  const [selectedType, setSelectedType] = useState('clients');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const { downloadExcel, isDownloading } = useExcelDownload();
  const [importData, { isLoading: isImporting }] = useImportDataMutation();

  const currentType = IMPORT_TYPES.find((t) => t.value === selectedType);

  const handleFileChange = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      toast.error('Format non supporté. Utilisez .xlsx, .xls ou .csv');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.warning('Veuillez sélectionner un fichier');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await importData({ type: selectedType, formData }).unwrap();
      setResult(res.data);
      if (res.data.imported > 0 || res.data.updated > 0) {
        toast.success(res.message);
      } else {
        toast.warning(res.message);
      }
    } catch (err) {
      toast.error(err?.data?.message || "Erreur lors de l'import");
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <div className="page-header mb-4">
        <div>
          <h1 className="mb-0">Import / Export</h1>
          <p className="text-muted small mb-0">Importez vos données depuis Excel/CSV ou exportez-les</p>
        </div>
      </div>

      <Row className="g-4">
        {/* ── Colonne gauche : sélection type + upload ── */}
        <Col lg={7}>
          {/* Sélection du type */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h6 className="mb-0">1. Choisir le type de données</h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-2">
                {IMPORT_TYPES.map((t) => (
                  <Col key={t.value} sm={4}>
                    <div
                      role="button"
                      onClick={() => { setSelectedType(t.value); handleReset(); }}
                      className="border rounded-2 p-3 text-center h-100"
                      style={{
                        cursor: 'pointer',
                        borderColor: selectedType === t.value ? t.color : '#dee2e6',
                        backgroundColor: selectedType === t.value ? `${t.color}08` : 'transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div className="fw-semibold" style={{ color: t.color }}>{t.label}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>{t.description}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          {/* Zone d'upload */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">2. Charger le fichier Excel / CSV</h6>
              <Button
                variant="outline-success"
                size="sm"
                disabled={isDownloading}
                onClick={() => downloadExcel(`/imports/template/${selectedType}`, `template-${selectedType}.xlsx`)}
              >
                <FiDownload className="me-1" />
                {isDownloading ? 'Téléchargement...' : 'Télécharger le modèle'}
              </Button>
            </Card.Header>
            <Card.Body>
              {!file ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 rounded-2 d-flex flex-column align-items-center justify-content-center text-center"
                  style={{
                    border: `2px dashed ${dragOver ? '#1a56db' : '#dee2e6'}`,
                    backgroundColor: dragOver ? '#1a56db08' : '#f8f9fa',
                    cursor: 'pointer',
                    padding: '48px 24px',
                    transition: 'all 0.15s',
                  }}
                >
                  <FiUpload size={32} className="mb-2 text-muted" />
                  <p className="fw-semibold mb-1">Glissez-déposez votre fichier ici</p>
                  <p className="text-muted small mb-2">ou cliquez pour parcourir</p>
                  <Badge bg="light" text="dark">.xlsx, .xls, .csv — max 5 MB</Badge>
                  <Form.Control
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                    className="d-none"
                  />
                </div>
              ) : (
                <div className="border rounded-2 p-3 d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 44, height: 44, backgroundColor: '#05906915', color: '#059669' }}
                  >
                    <FiFile size={20} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold text-truncate">{file.name}</div>
                    <div className="text-muted small">{(file.size / 1024).toFixed(0)} KB</div>
                  </div>
                  <Button variant="link" size="sm" className="text-danger p-0" onClick={handleReset}>
                    <FiX size={18} />
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Bouton import */}
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!file || isImporting}
              className="flex-grow-1"
            >
              {isImporting ? (
                <><Spinner size="sm" animation="border" className="me-2" /> Import en cours...</>
              ) : (
                <><FiUpload className="me-2" /> Lancer l'import</>
              )}
            </Button>
            {file && (
              <Button variant="outline-secondary" onClick={handleReset}>
                Annuler
              </Button>
            )}
          </div>
        </Col>

        {/* ── Colonne droite : aide + résultats ── */}
        <Col lg={5}>
          {/* Guide */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Guide d'import — {currentType?.label}</h6>
            </Card.Header>
            <Card.Body>
              <ol className="ps-3 mb-3" style={{ fontSize: '0.875rem' }}>
                <li className="mb-1">Téléchargez le <strong>modèle Excel</strong> correspondant</li>
                <li className="mb-1">Remplissez les colonnes (les colonnes marquées <strong>*</strong> sont obligatoires)</li>
                <li className="mb-1">Supprimez les lignes d'exemple</li>
                <li className="mb-1">Importez le fichier complété</li>
              </ol>
              <Alert variant="info" className="mb-2 py-2 small">
                <strong>Mise à jour automatique :</strong> si un enregistrement avec le même email (ou même nom pour les produits) existe déjà, il sera mis à jour.
              </Alert>
              <div className="text-muted small">
                <strong>Colonnes ({currentType?.label}) :</strong><br />
                {currentType?.fields}
              </div>
            </Card.Body>
          </Card>

          {/* Résultats */}
          {result && (
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Résultats de l'import</h6>
              </Card.Header>
              <Card.Body>
                <Row className="g-2 mb-3">
                  <Col xs={4}>
                    <div className="text-center p-2 rounded-2" style={{ backgroundColor: '#05906910' }}>
                      <div className="fw-bold fs-5 text-success">{result.imported}</div>
                      <div className="text-muted small">Ajoutés</div>
                    </div>
                  </Col>
                  <Col xs={4}>
                    <div className="text-center p-2 rounded-2" style={{ backgroundColor: '#1a56db10' }}>
                      <div className="fw-bold fs-5 text-primary">{result.updated}</div>
                      <div className="text-muted small">Mis à jour</div>
                    </div>
                  </Col>
                  <Col xs={4}>
                    <div className="text-center p-2 rounded-2" style={{ backgroundColor: '#dc262610' }}>
                      <div className="fw-bold fs-5 text-danger">{result.errors.length}</div>
                      <div className="text-muted small">Erreurs</div>
                    </div>
                  </Col>
                </Row>

                {result.errors.length === 0 ? (
                  <Alert variant="success" className="d-flex align-items-center gap-2 py-2 mb-0">
                    <FiCheckCircle /> Import réussi sans erreur
                  </Alert>
                ) : (
                  <>
                    <Alert variant="warning" className="d-flex align-items-center gap-2 py-2 mb-2">
                      <FiAlertTriangle /> {result.errors.length} ligne(s) ignorée(s) — voir détails ci-dessous
                    </Alert>
                    <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                      <Table size="sm" striped className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: 50 }}>Ligne</th>
                            <th>Champ</th>
                            <th>Erreur</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.errors.map((e, i) => (
                            <tr key={i}>
                              <td>{e.row}</td>
                              <td>{e.field}</td>
                              <td className="text-danger small">{e.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Export rapide */}
          {!result && (
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Exports disponibles</h6>
              </Card.Header>
              <Card.Body className="d-grid gap-2">
                {[
                  { label: 'Clients', path: '/imports/export/clients', file: 'clients.xlsx' },
                  { label: 'Fournisseurs', path: '/imports/export/fournisseurs', file: 'fournisseurs.xlsx' },
                  { label: 'Produits', path: '/imports/export/produits', file: 'produits.xlsx' },
                  { label: 'Stocks', path: '/imports/export/stocks', file: 'stocks.xlsx' },
                  { label: 'Paiements', path: '/imports/export/paiements', file: 'paiements.xlsx' },
                  { label: 'Factures', path: '/factures/export', file: 'factures.xlsx' },
                ].map((exp) => (
                  <Button
                    key={exp.path}
                    variant="outline-secondary"
                    size="sm"
                    className="text-start d-flex align-items-center"
                    disabled={isDownloading}
                    onClick={() => downloadExcel(exp.path, exp.file)}
                  >
                    <FiDownload className="me-2 flex-shrink-0" />
                    Exporter {exp.label}
                  </Button>
                ))}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </>
  );
};

export default ImportPage;
