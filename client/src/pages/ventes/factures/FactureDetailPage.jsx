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
import Form from 'react-bootstrap/Form';
import {
  FiEdit2,
  FiTrash2,
  FiSend,
  FiCheckCircle,
  FiArrowLeft,
  FiFileText,
  FiRotateCcw,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../../utils/formatters';
import {
  useGetFactureQuery,
  useDeleteFactureMutation,
  useValidateFactureMutation,
  useSendFactureMutation,
  useCreateAvoirMutation,
} from '../../../redux/api/facturesApi';
import usePdfActions from '../../../hooks/usePdfActions';
import { PrintToolbar, DocumentHeader, PdfPreviewModal } from '../../../components/print';

const statusColors = {
  brouillon: 'secondary',
  validee: 'primary',
  envoyee: 'info',
  payee_partiellement: 'warning',
  payee: 'success',
  annulee: 'danger',
};

const statusLabels = {
  brouillon: 'Brouillon',
  validee: 'Validee',
  envoyee: 'Envoyee',
  payee_partiellement: 'Payee partiellement',
  payee: 'Payee',
  annulee: 'Annulee',
};

const FactureDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [avoirModalOpen, setAvoirModalOpen] = useState(false);
  const [avoirType, setAvoirType] = useState('total'); // 'total' | 'partiel'
  const [avoirMotif, setAvoirMotif] = useState('');
  const [avoirLignes, setAvoirLignes] = useState([]);

  usePageTitle('Detail de la facture', [
    { label: 'Accueil', path: '/' },
    { label: 'Ventes', path: '#' },
    { label: 'Factures', path: '/ventes/factures' },
    { label: 'Detail', path: '#' },
  ]);

  const { data, isLoading, isError, error } = useGetFactureQuery(id);
  const [deleteFacture, { isLoading: isDeleting }] = useDeleteFactureMutation();
  const [validateFacture, { isLoading: isValidating }] = useValidateFactureMutation();
  const [sendFacture, { isLoading: isSending }] = useSendFactureMutation();
  const [createAvoir, { isLoading: isCreatingAvoir }] = useCreateAvoirMutation();

  const { downloadPdf, printPdf, previewPdf, closePreview, previewUrl, isLoading: isPdfLoading } = usePdfActions();

  const handleDelete = async () => {
    try {
      await deleteFacture(id).unwrap();
      toast.success('Facture supprimee avec succes');
      navigate('/ventes/factures');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleValidate = async () => {
    try {
      await validateFacture(id).unwrap();
      toast.success('Facture validee avec succes');
      setValidateModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleSend = async () => {
    try {
      await sendFacture(id).unwrap();
      toast.success('Facture envoyee au client avec succes');
    } catch (err) {
      toast.error(err?.data?.message || "Erreur lors de l'envoi");
    }
  };

  const openAvoirModal = (facture) => {
    setAvoirType('total');
    setAvoirMotif('');
    setAvoirLignes(
      (facture?.lignes || []).map((l) => ({ ligneFactureId: l._id, quantite: l.quantite, max: l.quantite, designation: l.designation }))
    );
    setAvoirModalOpen(true);
  };

  const handleCreateAvoir = async () => {
    try {
      const payload = { motif: avoirMotif };
      if (avoirType === 'partiel') {
        payload.lignes = avoirLignes
          .filter((l) => l.quantite > 0)
          .map((l) => ({ ligneFactureId: l.ligneFactureId, quantite: Number(l.quantite) }));
        if (payload.lignes.length === 0) {
          toast.error('Sélectionnez au moins une ligne avec quantité > 0');
          return;
        }
      }
      const res = await createAvoir({ id, ...payload }).unwrap();
      toast.success('Avoir créé avec succès');
      setAvoirModalOpen(false);
      navigate(`/ventes/avoirs/${res.data._id}`);
    } catch (err) {
      toast.error(err?.data?.message || "Erreur lors de la création de l'avoir");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement de la facture...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="danger">
        Erreur lors du chargement de la facture: {error?.data?.message || error?.message}
      </Alert>
    );
  }

  const facture = data?.data;

  if (!facture) {
    return <Alert variant="warning">Facture non trouvee</Alert>;
  }

  const calculateLigne = (ligne) => {
    const ht = Math.round(ligne.quantite * ligne.prixUnitaire * (1 - ligne.remise / 100));
    const tva = Math.round((ht * ligne.tauxTVA) / 100);
    return { ht, tva, ttc: ht + tva };
  };

  const montantPaye = facture.montantPaye || 0;
  const resteAPayer = (facture.totalTTC || 0) - montantPaye;
  const pdfPath = `/factures/${id}/pdf`;
  const pdfFilename = `${facture.numero || 'facture'}.pdf`;

  const tiers = facture.clientSnapshot
    ? { nom: facture.clientSnapshot.displayName, email: facture.clientSnapshot.email, phone: facture.clientSnapshot.phone }
    : facture.client
    ? { nom: facture.client.displayName || facture.client.nom, email: facture.client.email }
    : null;

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button
            variant="link"
            className="p-0 me-3 text-decoration-none"
            onClick={() => navigate('/ventes/factures')}
          >
            <FiArrowLeft className="me-2" />
            Retour
          </Button>
          <h1 className="d-inline-block ms-2">Facture {facture.numero}</h1>
        </div>
        <div className="d-flex align-items-center gap-2">
          {facture.statut === 'brouillon' && (
            <>
              <Button
                variant="warning"
                onClick={() => navigate(`/ventes/factures/${id}/modifier`)}
              >
                <FiEdit2 className="me-2" />
                Modifier
              </Button>
              <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
                <FiTrash2 className="me-2" />
                Supprimer
              </Button>
              <Button variant="success" onClick={() => setValidateModalOpen(true)}>
                <FiCheckCircle className="me-2" />
                Valider
              </Button>
            </>
          )}
          {(facture.statut === 'validee' || facture.statut === 'envoyee') && (
            <Button variant="info" onClick={handleSend} disabled={isSending}>
              <FiSend className="me-2" />
              {isSending ? 'Envoi...' : 'Envoyer'}
            </Button>
          )}
          {facture.statut !== 'brouillon' && facture.statut !== 'annulee' && facture.typeDocument !== 'avoir' && (
            <Button variant="outline-warning" onClick={() => openAvoirModal(facture)}>
              <FiRotateCcw className="me-2" />
              Créer avoir
            </Button>
          )}
          {facture.typeDocument === 'avoir' && facture.factureOrigine && (
            <Button
              as={Link}
              to={`/ventes/factures/${facture.factureOrigine._id || facture.factureOrigine}`}
              variant="outline-secondary"
              size="sm"
            >
              <FiFileText className="me-1" />
              Facture d'origine
            </Button>
          )}
          <PrintToolbar
            onPreview={() => previewPdf(pdfPath)}
            onPrint={() => printPdf(pdfPath)}
            onDownload={() => downloadPdf(pdfPath, pdfFilename)}
            isLoading={isPdfLoading}
          />
        </div>
      </div>

      <DocumentHeader
        docLabel="Informations de la facture"
        numero={facture.numero}
        statut={facture.statut}
        statusColors={statusColors}
        statusLabels={statusLabels}
        dateFields={[
          { label: 'Date', value: formatDate(facture.dateFacture || facture.date) },
          { label: "Date d'echeance", value: formatDate(facture.dateEcheance) },
        ]}
        conditionsPaiement={facture.conditionsPaiement}
        notes={facture.notes}
        tiersLabel="Client"
        tiers={tiers}
      />

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h6 className="mb-0">Lignes de la facture</h6>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Designation</th>
                <th className="text-center">Quantite</th>
                <th className="text-end">Prix unitaire</th>
                <th className="text-center">Remise</th>
                <th className="text-center">TVA</th>
                <th className="text-end">Total HT</th>
                <th className="text-end">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              {facture.lignes?.map((ligne, index) => {
                const calc = calculateLigne(ligne);
                return (
                  <tr key={index}>
                    <td>
                      {ligne.designation}
                      {ligne.reference && (
                        <small className="text-muted d-block">Ref: {ligne.reference}</small>
                      )}
                    </td>
                    <td className="text-center">{ligne.quantite}</td>
                    <td className="text-end">{formatMoney(ligne.prixUnitaire)}</td>
                    <td className="text-center">{ligne.remise}%</td>
                    <td className="text-center">{ligne.tauxTVA}%</td>
                    <td className="text-end">{formatMoney(calc.ht)}</td>
                    <td className="text-end">
                      <strong>{formatMoney(calc.ttc)}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Informations de paiement</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <div className="mb-2">
                    <small className="text-muted">Montant paye</small>
                    <h5 className="text-success mb-0">{formatMoney(montantPaye)}</h5>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="mb-2">
                    <small className="text-muted">Reste a payer</small>
                    <h5 className={resteAPayer === 0 ? 'text-success mb-0' : 'text-danger mb-0'}>
                      {formatMoney(resteAPayer)}
                    </h5>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="mb-2">
                    <small className="text-muted">Statut paiement</small>
                    <h5 className="mb-0">
                      <Badge bg={statusColors[facture.statut]}>
                        {statusLabels[facture.statut]}
                      </Badge>
                    </h5>
                  </div>
                </Col>
              </Row>
              {facture.paiements && facture.paiements.length > 0 && (
                <div className="mt-3">
                  <h6>Paiements associes</h6>
                  <Table size="sm" hover>
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Methode</th>
                        <th className="text-end">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facture.paiements.map((paiement, index) => (
                        <tr
                          key={index}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/paiements/${paiement._id}`)}
                        >
                          <td>{formatDate(paiement.date)}</td>
                          <td>{paiement.methodePaiement}</td>
                          <td className="text-end">{formatMoney(paiement.montant)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Total HT:</span>
                <strong>{formatMoney(facture.totalHT)}</strong>
              </div>
              {facture.remiseGlobale > 0 && (
                <div className="d-flex justify-content-between mb-2 text-muted">
                  <span>Remise globale ({facture.remiseGlobale}%):</span>
                  <span>
                    -{formatMoney(Math.round((facture.totalHT * facture.remiseGlobale) / 100))}
                  </span>
                </div>
              )}
              <div className="d-flex justify-content-between mb-2">
                <span>Total TVA:</span>
                <strong>{formatMoney(facture.totalTVA)}</strong>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Total TTC:</strong>
                <h4 className="text-primary mb-0">{formatMoney(facture.totalTTC)}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal création d'avoir */}
      <Modal show={avoirModalOpen} onHide={() => setAvoirModalOpen(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Créer un avoir — {facture.numero}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="small">
            Un avoir annule partiellement ou totalement la facture. Il génère une écriture comptable de contrepassation.
          </Alert>
          <Form.Group className="mb-3">
            <Form.Label>Type d'avoir</Form.Label>
            <div className="d-flex gap-3">
              <Form.Check
                type="radio"
                label="Avoir total (annulation complète)"
                checked={avoirType === 'total'}
                onChange={() => setAvoirType('total')}
                id="avoir-total"
              />
              <Form.Check
                type="radio"
                label="Avoir partiel (sélectionner les lignes)"
                checked={avoirType === 'partiel'}
                onChange={() => setAvoirType('partiel')}
                id="avoir-partiel"
              />
            </div>
          </Form.Group>

          {avoirType === 'partiel' && (
            <Table size="sm" bordered className="mb-3">
              <thead className="table-light">
                <tr>
                  <th>Désignation</th>
                  <th className="text-center" style={{ width: 80 }}>Qté max</th>
                  <th className="text-center" style={{ width: 100 }}>Qté avoir</th>
                </tr>
              </thead>
              <tbody>
                {avoirLignes.map((ligne, idx) => (
                  <tr key={idx}>
                    <td className="small">{ligne.designation}</td>
                    <td className="text-center small">{ligne.max}</td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        min={0}
                        max={ligne.max}
                        step={0.01}
                        value={ligne.quantite}
                        onChange={(e) => {
                          const updated = [...avoirLignes];
                          updated[idx] = { ...ligne, quantite: Math.min(Number(e.target.value), ligne.max) };
                          setAvoirLignes(updated);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          <Form.Group>
            <Form.Label>Motif de l'avoir</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={avoirMotif}
              onChange={(e) => setAvoirMotif(e.target.value)}
              placeholder="Ex: Retour marchandise, erreur de facturation, remise commerciale..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAvoirModalOpen(false)}>
            Annuler
          </Button>
          <Button variant="warning" onClick={handleCreateAvoir} disabled={isCreatingAvoir}>
            {isCreatingAvoir
              ? <Spinner animation="border" size="sm" className="me-1" />
              : <FiRotateCcw className="me-1" />}
            Créer l'avoir
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={deleteModalOpen} onHide={() => setDeleteModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Etes-vous sur de vouloir supprimer la facture <strong>{facture.numero}</strong> ? Cette
          action est irreversible.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={validateModalOpen} onHide={() => setValidateModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Valider la facture</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Voulez-vous valider la facture <strong>{facture.numero}</strong> ? Une fois validee, vous ne pourrez plus la modifier.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setValidateModalOpen(false)}>
            Annuler
          </Button>
          <Button variant="success" onClick={handleValidate} disabled={isValidating}>
            {isValidating ? 'Validation...' : 'Valider'}
          </Button>
        </Modal.Footer>
      </Modal>

      <PdfPreviewModal
        show={!!previewUrl}
        onHide={closePreview}
        blobUrl={previewUrl}
        documentTitle={facture.numero}
        onDownload={() => downloadPdf(pdfPath, pdfFilename)}
        onPrint={() => printPdf(pdfPath)}
      />
    </>
  );
};

export default FactureDetailPage;
