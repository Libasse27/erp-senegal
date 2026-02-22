import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Table from 'react-bootstrap/Table';
import { FiEdit2, FiTrash2, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import {
  useGetClientQuery,
  useDeleteClientMutation,
} from '../../redux/api/clientsApi';

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('informations');

  const { data: clientData, isLoading, error } = useGetClientQuery(id);
  const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation();

  const client = clientData?.data;

  usePageTitle(
    client
      ? client.type === 'entreprise'
        ? client.raisonSociale
        : `${client.firstName} ${client.lastName}`
      : 'Detail Client',
    [
      { label: 'Accueil', path: '/' },
      { label: 'Clients', path: '/clients' },
      { label: 'Detail' },
    ]
  );

  const handleDelete = async () => {
    const name =
      client.type === 'entreprise'
        ? client.raisonSociale
        : `${client.firstName} ${client.lastName}`;

    if (window.confirm(`Etes-vous sur de vouloir supprimer le client "${name}" ?`)) {
      try {
        await deleteClient(id).unwrap();
        toast.success('Client supprime avec succes');
        navigate('/clients');
      } catch (err) {
        toast.error(err.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const getSegmentBadgeVariant = (segment) => {
    switch (segment) {
      case 'A':
        return 'success';
      case 'B':
        return 'warning';
      case 'C':
        return 'secondary';
      default:
        return 'light';
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
        Erreur lors du chargement du client: {error.data?.message || error.message}
      </Alert>
    );
  }

  if (!client) {
    return <Alert variant="warning">Client introuvable</Alert>;
  }

  const clientName =
    client.type === 'entreprise'
      ? client.raisonSociale
      : `${client.firstName} ${client.lastName}`;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{clientName}</h1>
          <div className="d-flex align-items-center gap-2 mt-2">
            <Badge bg={getSegmentBadgeVariant(client.segment)}>
              Segment {client.segment || 'N/A'}
            </Badge>
            <Badge bg="info">{client.code}</Badge>
            <Badge bg={client.type === 'entreprise' ? 'primary' : 'secondary'}>
              {client.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
            </Badge>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="primary"
            onClick={() => navigate(`/clients/${id}/modifier`)}
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

      <Row className="g-3 mb-3">
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h6 className="text-muted mb-3">Chiffre d'Affaires Total</h6>
              <h3 className="text-success mb-0">{formatMoney(0)}</h3>
              <small className="text-muted">Depuis la creation</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h6 className="text-muted mb-3">Creances</h6>
              <h3 className="text-warning mb-0">{formatMoney(0)}</h3>
              <small className="text-muted">A recevoir</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h6 className="text-muted mb-3">Nombre de Factures</h6>
              <h3 className="text-primary mb-0">0</h3>
              <small className="text-muted">Depuis la creation</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Tab eventKey="informations" title="Informations">
              <div className="pt-4">
                <Row className="g-4">
                  <Col md={6}>
                    <h6 className="text-muted mb-3">Coordonnees</h6>
                    <div className="mb-3">
                      <div className="d-flex align-items-start gap-2">
                        <FiMail className="mt-1 text-muted" />
                        <div>
                          <small className="text-muted d-block">Email</small>
                          <div>{client.email || '-'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex align-items-start gap-2">
                        <FiPhone className="mt-1 text-muted" />
                        <div>
                          <small className="text-muted d-block">Telephone</small>
                          <div>{client.phone || '-'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="d-flex align-items-start gap-2">
                        <FiMapPin className="mt-1 text-muted" />
                        <div>
                          <small className="text-muted d-block">Adresse</small>
                          {client.address ? (
                            <>
                              {client.address.street && (
                                <div>{client.address.street}</div>
                              )}
                              <div>
                                {[
                                  client.address.city,
                                  client.address.region,
                                  client.address.postalCode,
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
                  </Col>

                  <Col md={6}>
                    <h6 className="text-muted mb-3">Informations Commerciales</h6>
                    <div className="mb-3">
                      <small className="text-muted d-block">Delai de Paiement</small>
                      <div>{client.delaiPaiement || 0} jours</div>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted d-block">Limite de Credit</small>
                      <div>{formatMoney(client.creditLimit || 0)}</div>
                    </div>
                    {client.type === 'entreprise' && (
                      <>
                        <div className="mb-3">
                          <small className="text-muted d-block">NINEA</small>
                          <div>{client.ninea || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <small className="text-muted d-block">RCCM</small>
                          <div>{client.rccm || '-'}</div>
                        </div>
                      </>
                    )}
                  </Col>

                  {client.notes && (
                    <Col md={12}>
                      <h6 className="text-muted mb-3">Notes</h6>
                      <Card className="bg-light">
                        <Card.Body>
                          <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                            {client.notes}
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}

                  <Col md={12}>
                    <h6 className="text-muted mb-3">Informations Systeme</h6>
                    <Row>
                      <Col md={6}>
                        <small className="text-muted d-block">Date de creation</small>
                        <div>{formatDate(client.createdAt)}</div>
                      </Col>
                      <Col md={6}>
                        <small className="text-muted d-block">Derniere modification</small>
                        <div>{formatDate(client.updatedAt)}</div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </div>
            </Tab>

            <Tab eventKey="factures" title="Factures">
              <div className="pt-4">
                <Alert variant="info">
                  Aucune facture pour ce client. Les factures apparaitront ici une fois
                  le module de facturation active.
                </Alert>
              </div>
            </Tab>

            <Tab eventKey="paiements" title="Paiements">
              <div className="pt-4">
                <Alert variant="info">
                  Aucun paiement pour ce client. Les paiements apparaitront ici une fois
                  le module de tresorerie active.
                </Alert>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </>
  );
};

export default ClientDetailPage;
