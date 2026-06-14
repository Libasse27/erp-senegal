import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiTrash2,
  FiLink,
  FiAlertTriangle,
  FiFileText,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../../utils/formatters';
import {
  useGetFactureQuery,
  useValidateFactureMutation,
  useDeleteFactureMutation,
} from '../../../redux/api/facturesApi';
import usePdfActions from '../../../hooks/usePdfActions';
import { PrintToolbar, PdfPreviewModal } from '../../../components/print';
import { useAuth } from '../../../contexts/AuthContext';
import { PERM } from '../../../config/permissions';

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon', variant: 'secondary' },
  validee:   { label: 'Validé',    variant: 'primary' },
  envoyee:   { label: 'Envoyé',    variant: 'info' },
  annulee:   { label: 'Annulé',    variant: 'danger' },
};

const AvoirDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  usePageTitle('Détail Avoir', [
    { label: 'Accueil', path: '/' },
    { label: 'Ventes', path: '#' },
    { label: 'Avoirs', path: '/ventes/avoirs' },
    { label: 'Détail' },
  ]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);

  const { data, isLoading, isError, error } = useGetFactureQuery(id);
  const [validateFacture, { isLoading: isValidating }] = useValidateFactureMutation();
  const [deleteFacture, { isLoading: isDeleting }] = useDeleteFactureMutation();
  const { downloadPdf, printPdf, previewPdf, closePreview, previewUrl, isLoading: isPdfLoading } =
    usePdfActions();

  const handleValidate = async () => {
    try {
      await validateFacture(id).unwrap();
      toast.success('Avoir validé avec succès');
      setShowValidateModal(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFacture(id).unwrap();
      toast.success('Avoir supprimé');
      navigate('/ventes/avoirs');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la suppression');
    }
  };

  if (isLoading) return (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" />
    </div>
  );

  if (isError) return (
    <Alert variant="danger">
      <FiAlertTriangle className="me-2" />
      {error?.data?.message || error?.message}
    </Alert>
  );

  const avoir = data?.data;
  if (!avoir) return <Alert variant="warning">Avoir introuvable</Alert>;

  const cfg = STATUT_CONFIG[avoir.statut] || { label: avoir.statut, variant: 'secondary' };
  const pdfPath = `/factures/${id}/pdf`;
  const pdfFilename = `${avoir.numero || 'avoir'}.pdf`;
  const canValidate = hasPermission(PERM.FACTURES_VALIDATE);
  const canDelete = hasPermission(PERM.FACTURES_DELETE);

  const tiers = avoir.clientSnapshot
    ? avoir.clientSnapshot.displayName || avoir.clientSnapshot.raisonSociale
    : avoir.client?.raisonSociale || '—';

  return (
    <>
      <div className="page-header">
        <div className="d-flex align-items-center gap-3">
          <Button variant="outline-secondary" size="sm" onClick={() => navigate('/ventes/avoirs')}>
            <FiArrowLeft />
          </Button>
          <div>
            <div className="d-flex align-items-center gap-2">
              <FiFileText size={18} className="text-warning" />
              <h1 className="mb-0">Avoir {avoir.numero}</h1>
              <Badge bg={cfg.variant}>{cfg.label}</Badge>
            </div>
            {avoir.factureOrigine && (
              <small className="text-muted">
                <FiLink size={12} className="me-1" />
                Facture d'origine :{' '}
                <Link
                  to={`/ventes/factures/${avoir.factureOrigine._id || avoir.factureOrigine}`}
                  className="text-decoration-none"
                >
                  {avoir.factureOrigine.numero || 'Voir la facture'}
                </Link>
              </small>
            )}
          </div>
        </div>
        <div className="d-flex gap-2">
          {avoir.statut === 'brouillon' && canValidate && (
            <Button variant="success" size="sm" onClick={() => setShowValidateModal(true)}>
              <FiCheckCircle className="me-1" /> Valider l'avoir
            </Button>
          )}
          {avoir.statut === 'brouillon' && canDelete && (
            <Button variant="outline-danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              <FiTrash2 />
            </Button>
          )}
          {avoir.statut !== 'brouillon' && (
            <PrintToolbar
              onPreview={() => previewPdf(pdfPath)}
              onPrint={() => printPdf(pdfPath)}
              onDownload={() => downloadPdf(pdfPath, pdfFilename)}
              isLoading={isPdfLoading}
            />
          )}
        </div>
      </div>

      {/* Alerte info avoir */}
      <Alert variant="warning" className="d-flex align-items-center gap-2 mb-3">
        <FiAlertTriangle size={18} className="flex-shrink-0" />
        <div>
          Cet avoir <strong>annule partiellement ou totalement</strong> la facture d'origine. Les
          montants ci-dessous sont <strong>créditeurs</strong> (en faveur du client).
        </div>
      </Alert>

      <Row className="g-3">
        <Col lg={8}>
          {/* En-tête */}
          <Card className="shadow-sm mb-3">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6 className="text-muted mb-1">Client</h6>
                  <div className="fw-semibold">{tiers}</div>
                  {avoir.clientSnapshot?.email && (
                    <div className="text-muted small">{avoir.clientSnapshot.email}</div>
                  )}
                </Col>
                <Col md={6} className="text-md-end">
                  <div className="text-muted small">Date de l'avoir</div>
                  <div className="fw-semibold">{formatDate(avoir.dateFacture)}</div>
                  {avoir.factureOrigine?.numero && (
                    <div className="mt-2 small">
                      <span className="text-muted">Facture annulée : </span>
                      <Link
                        to={`/ventes/factures/${avoir.factureOrigine._id || avoir.factureOrigine}`}
                        className="fw-semibold"
                      >
                        {avoir.factureOrigine.numero}
                      </Link>
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Lignes */}
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Lignes de l'avoir</h6>
            </Card.Header>
            <Card.Body className="p-0">
              <Table className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Désignation</th>
                    <th className="text-end">Qté</th>
                    <th className="text-end">Prix HT</th>
                    <th className="text-end">Rem.%</th>
                    <th className="text-end">TVA%</th>
                    <th className="text-end">Montant HT</th>
                    <th className="text-end">Montant TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {(avoir.lignes || []).map((ligne, idx) => {
                    const ht = Math.round(
                      ligne.quantite * ligne.prixUnitaire * (1 - ligne.remise / 100)
                    );
                    const ttc = ht + Math.round((ht * ligne.tauxTVA) / 100);
                    return (
                      <tr key={idx}>
                        <td>
                          <div className="fw-medium small">{ligne.designation}</div>
                          {ligne.reference && (
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {ligne.reference}
                            </div>
                          )}
                        </td>
                        <td className="text-end small">{ligne.quantite}</td>
                        <td className="text-end small">{formatMoney(ligne.prixUnitaire)}</td>
                        <td className="text-end small">{ligne.remise > 0 ? `${ligne.remise}%` : '—'}</td>
                        <td className="text-end small">{ligne.tauxTVA}%</td>
                        <td className="text-end small text-danger">-{formatMoney(ht)}</td>
                        <td className="text-end fw-semibold small text-danger">
                          -{formatMoney(ttc)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Totaux */}
        <Col lg={4}>
          <Card className="shadow-sm border-warning">
            <Card.Header className="bg-warning bg-opacity-10">
              <h6 className="mb-0 text-warning">Récapitulatif de l'avoir</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Total HT</span>
                <span className="text-danger fw-medium">-{formatMoney(avoir.totalHT)}</span>
              </div>
              {avoir.remiseGlobale > 0 && (
                <div className="d-flex justify-content-between mb-2 text-muted small">
                  <span>Remise ({avoir.remiseGlobale}%)</span>
                  <span>
                    -{formatMoney(Math.round((avoir.totalHT * avoir.remiseGlobale) / 100))}
                  </span>
                </div>
              )}
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">TVA</span>
                <span className="text-danger fw-medium">-{formatMoney(avoir.totalTVA)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Total TTC à rembourser</strong>
                <h4 className="text-danger mb-0">-{formatMoney(avoir.totalTTC)}</h4>
              </div>
            </Card.Body>
          </Card>

          {avoir.notes && (
            <Card className="shadow-sm mt-3">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Motif / Notes</h6>
              </Card.Header>
              <Card.Body>
                <p className="mb-0 text-muted small">{avoir.notes}</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Modal validation */}
      <Modal show={showValidateModal} onHide={() => setShowValidateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Valider l'avoir</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Valider l'avoir <strong>{avoir.numero}</strong> ? Il sera numéroté définitivement et une
          écriture comptable de contrepassation sera générée.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowValidateModal(false)}>
            Annuler
          </Button>
          <Button variant="success" onClick={handleValidate} disabled={isValidating}>
            {isValidating ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Valider
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Supprimer l'avoir</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Supprimer l'avoir <strong>{avoir.numero}</strong> ? Cette action est irréversible.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>

      <PdfPreviewModal
        show={!!previewUrl}
        onHide={closePreview}
        blobUrl={previewUrl}
        documentTitle={avoir.numero}
        onDownload={() => downloadPdf(pdfPath, pdfFilename)}
        onPrint={() => printPdf(pdfPath)}
      />
    </>
  );
};

export default AvoirDetailPage;
