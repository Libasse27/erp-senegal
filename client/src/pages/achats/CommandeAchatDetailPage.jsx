import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { FiEdit2, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import { calculateLigne } from '../../components/forms';
import {
  useGetCommandeAchatQuery,
  useDeleteCommandeAchatMutation,
  useUpdateCommandeAchatStatutMutation,
} from '../../redux/api/commandesAchatApi';

const statusColors = {
  brouillon: 'secondary',
  envoyee: 'info',
  confirmee: 'primary',
  partiellement_recue: 'warning',
  recue: 'success',
  annulee: 'danger',
};

const statusLabels = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyee',
  confirmee: 'Confirmee',
  partiellement_recue: 'Partiellement recue',
  recue: 'Recue',
  annulee: 'Annulee',
};

const CommandeAchatDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statutModalOpen, setStatutModalOpen] = useState(false);
  const [newStatut, setNewStatut] = useState('');

  usePageTitle('Detail commande achat', [
    { label: 'Accueil', path: '/' },
    { label: 'Achats', path: '#' },
    { label: 'Commandes achat', path: '/achats/commandes' },
    { label: 'Detail', path: '#' },
  ]);

  const { data, isLoading, isError, error } = useGetCommandeAchatQuery(id);
  const [deleteCommande, { isLoading: isDeleting }] = useDeleteCommandeAchatMutation();
  const [updateStatut, { isLoading: isUpdatingStatut }] = useUpdateCommandeAchatStatutMutation();

  const handleDelete = async () => {
    try {
      await deleteCommande(id).unwrap();
      toast.success('Commande achat supprimee avec succes');
      navigate('/achats/commandes');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleUpdateStatut = async () => {
    try {
      await updateStatut({ id, statut: newStatut }).unwrap();
      toast.success('Statut mis a jour avec succes');
      setStatutModalOpen(false);
      setNewStatut('');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la mise a jour');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="danger">
        Erreur: {error?.data?.message || error?.message}
      </Alert>
    );
  }

  const cmd = data?.data;
  if (!cmd) return <Alert variant="warning">Commande achat non trouvee</Alert>;

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button
            variant="link"
            className="p-0 me-3 text-decoration-none"
            onClick={() => navigate('/achats/commandes')}
          >
            <FiArrowLeft className="me-2" />
            Retour
          </Button>
          <h1 className="d-inline-block ms-2">Commande achat {cmd.numero}</h1>
        </div>
        <div>
          {cmd.statut === 'brouillon' && (
            <>
              <Button
                variant="warning"
                className="me-2"
                onClick={() => navigate(`/achats/commandes/${id}/modifier`)}
              >
                <FiEdit2 className="me-2" />
                Modifier
              </Button>
              <Button
                variant="danger"
                className="me-2"
                onClick={() => setDeleteModalOpen(true)}
              >
                <FiTrash2 className="me-2" />
                Supprimer
              </Button>
            </>
          )}
          <Button
            variant="info"
            onClick={() => {
              setNewStatut(cmd.statut);
              setStatutModalOpen(true);
            }}
          >
            Changer statut
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Informations de la commande</h6>
                <Badge bg={statusColors[cmd.statut] || 'secondary'}>
                  {statusLabels[cmd.statut] || cmd.statut}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p className="mb-2">
                    <strong>Numero :</strong> {cmd.numero}
                  </p>
                  <p className="mb-2">
                    <strong>Date :</strong> {formatDate(cmd.dateCommande)}
                  </p>
                  {cmd.dateReceptionPrevue && (
                    <p className="mb-2">
                      <strong>Reception prevue :</strong>{' '}
                      {formatDate(cmd.dateReceptionPrevue)}
                    </p>
                  )}
                </Col>
                <Col md={6}>
                  {cmd.conditionsPaiement && (
                    <p className="mb-2">
                      <strong>Conditions de paiement :</strong>
                      <br />
                      {cmd.conditionsPaiement}
                    </p>
                  )}
                </Col>
              </Row>
              {cmd.notes && (
                <div className="mt-2">
                  <strong>Notes :</strong>
                  <p className="text-muted mb-0">{cmd.notes}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Fournisseur</h6>
            </Card.Header>
            <Card.Body>
              {cmd.fournisseurSnapshot ? (
                <>
                  <h6 className="mb-2">{cmd.fournisseurSnapshot.raisonSociale}</h6>
                  <p className="mb-1 small text-muted">
                    <strong>Email :</strong> {cmd.fournisseurSnapshot.email || 'N/A'}
                  </p>
                  <p className="mb-1 small text-muted">
                    <strong>Tel :</strong> {cmd.fournisseurSnapshot.phone || 'N/A'}
                  </p>
                  {cmd.fournisseurSnapshot.ninea && (
                    <p className="mb-1 small text-muted">
                      <strong>NINEA :</strong> {cmd.fournisseurSnapshot.ninea}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted mb-0">Aucun fournisseur associe</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h6 className="mb-0">Lignes de la commande</h6>
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
              {cmd.lignes?.map((ligne, index) => {
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

      <Card className="shadow-sm">
        <Card.Body>
          <Row>
            <Col md={8} />
            <Col md={4}>
              <div className="d-flex justify-content-between mb-2">
                <span>Total HT :</span>
                <strong>{formatMoney(cmd.totalHT)}</strong>
              </div>
              {cmd.remiseGlobale > 0 && (
                <div className="d-flex justify-content-between mb-2 text-muted">
                  <span>Remise globale ({cmd.remiseGlobale}%) :</span>
                  <span>
                    -{formatMoney(Math.round((cmd.totalHT * cmd.remiseGlobale) / 100))}
                  </span>
                </div>
              )}
              <div className="d-flex justify-content-between mb-2">
                <span>Total TVA :</span>
                <strong>{formatMoney(cmd.totalTVA)}</strong>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Total TTC :</strong>
                <h4 className="text-primary mb-0">{formatMoney(cmd.totalTTC)}</h4>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Modal suppression */}
      <Modal show={deleteModalOpen} onHide={() => setDeleteModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Etes-vous sur de vouloir supprimer la commande achat{' '}
          <strong>{cmd.numero}</strong> ? Cette action est irreversible.
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

      {/* Modal changement de statut */}
      <Modal show={statutModalOpen} onHide={() => setStatutModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Changer le statut</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Nouveau statut</Form.Label>
            <Form.Select value={newStatut} onChange={(e) => setNewStatut(e.target.value)}>
              <option value="envoyee">Envoyee</option>
              <option value="confirmee">Confirmee</option>
              <option value="partiellement_recue">Partiellement recue</option>
              <option value="recue">Recue</option>
              <option value="annulee">Annulee</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setStatutModalOpen(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleUpdateStatut} disabled={isUpdatingStatut}>
            {isUpdatingStatut ? 'Mise a jour...' : 'Mettre a jour'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CommandeAchatDetailPage;
