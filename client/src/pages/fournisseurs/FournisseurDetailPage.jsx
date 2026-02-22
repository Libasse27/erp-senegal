import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FiEdit2, FiTrash2, FiMail, FiPhone, FiMapPin, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/formatters';
import {
  useGetFournisseurQuery,
  useDeleteFournisseurMutation,
} from '../../redux/api/fournisseursApi';

const FournisseurDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: fournisseurData, isLoading, error } = useGetFournisseurQuery(id);
  const [deleteFournisseur, { isLoading: isDeleting }] =
    useDeleteFournisseurMutation();

  const fournisseur = fournisseurData?.data;

  usePageTitle(
    fournisseur ? fournisseur.raisonSociale : 'Detail Fournisseur',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Fournisseurs', path: '/fournisseurs' },
      { label: 'Detail' },
    ]
  );

  const handleDelete = async () => {
    if (
      window.confirm(
        `Etes-vous sur de vouloir supprimer le fournisseur "${fournisseur.raisonSociale}" ?`
      )
    ) {
      try {
        await deleteFournisseur(id).unwrap();
        toast.success('Fournisseur supprime avec succes');
        navigate('/fournisseurs');
      } catch (err) {
        toast.error(err.data?.message || 'Erreur lors de la suppression');
      }
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

  if (error) {
    return (
      <Alert variant="danger">
        Erreur lors du chargement du fournisseur:{' '}
        {error.data?.message || error.message}
      </Alert>
    );
  }

  if (!fournisseur) {
    return <Alert variant="warning">Fournisseur introuvable</Alert>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{fournisseur.raisonSociale}</h1>
          <div className="d-flex align-items-center gap-2 mt-2">
            <Badge bg="info">{fournisseur.code}</Badge>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="primary"
            onClick={() => navigate(`/fournisseurs/${id}/modifier`)}
          >
            <FiEdit2 className="me-2" />
            Modifier
          </Button>
          <Button
            variant="outline-danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <FiTrash2 className="me-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <Row className="g-3">
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Informations Generales</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex align-items-start gap-2">
                  <FiUser className="mt-1 text-muted" />
                  <div>
                    <small className="text-muted d-block">Personne de Contact</small>
                    <div>{fournisseur.contactName || '-'}</div>
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex align-items-start gap-2">
                  <FiMail className="mt-1 text-muted" />
                  <div>
                    <small className="text-muted d-block">Email</small>
                    <div>{fournisseur.email || '-'}</div>
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex align-items-start gap-2">
                  <FiPhone className="mt-1 text-muted" />
                  <div>
                    <small className="text-muted d-block">Telephone</small>
                    <div>{fournisseur.phone || '-'}</div>
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex align-items-start gap-2">
                  <FiMapPin className="mt-1 text-muted" />
                  <div>
                    <small className="text-muted d-block">Adresse</small>
                    {fournisseur.address ? (
                      <>
                        {fournisseur.address.street && (
                          <div>{fournisseur.address.street}</div>
                        )}
                        <div>
                          {[
                            fournisseur.address.city,
                            fournisseur.address.region,
                            fournisseur.address.postalCode,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </>
                    ) : (
                      '-'
                    )}
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Informations Commerciales</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <small className="text-muted d-block">NINEA</small>
                <div>{fournisseur.ninea || '-'}</div>
              </div>
              <div className="mb-3">
                <small className="text-muted d-block">RCCM</small>
                <div>{fournisseur.rccm || '-'}</div>
              </div>
              <div className="mb-3">
                <small className="text-muted d-block">Conditions de Paiement</small>
                <div>{fournisseur.conditionsPaiement || '-'}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {fournisseur.notes && (
          <Col md={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Notes</h6>
              </Card.Header>
              <Card.Body>
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {fournisseur.notes}
                </p>
              </Card.Body>
            </Card>
          </Col>
        )}

        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Informations Systeme</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <small className="text-muted d-block">Date de creation</small>
                  <div>{formatDate(fournisseur.createdAt)}</div>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block">Derniere modification</small>
                  <div>{formatDate(fournisseur.updatedAt)}</div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Historique des Achats</h6>
            </Card.Header>
            <Card.Body>
              <Alert variant="info" className="mb-0">
                Aucun achat enregistre pour ce fournisseur. Les achats apparaitront
                ici une fois le module d'approvisionnement active.
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default FournisseurDetailPage;
