import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Table from 'react-bootstrap/Table';
import { FiArrowLeft, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney, formatDate } from '../../utils/formatters';
import {
  useGetPaymentQuery,
  useValidatePaymentMutation,
  useCancelPaymentMutation,
} from '../../redux/api/paymentsApi';

const PaymentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  usePageTitle('Detail Paiement', [
    { label: 'Accueil', path: '/' },
    { label: 'Paiements', path: '/paiements' },
    { label: 'Detail' },
  ]);

  const { data, isLoading, error } = useGetPaymentQuery(id);
  const [validatePayment, { isLoading: isValidating }] = useValidatePaymentMutation();
  const [cancelPayment, { isLoading: isCanceling }] = useCancelPaymentMutation();

  const handleValidate = async () => {
    if (window.confirm('Etes-vous sur de vouloir valider ce paiement ?')) {
      try {
        await validatePayment(id).unwrap();
        toast.success('Paiement valide avec succes');
      } catch (err) {
        toast.error(err.data?.message || 'Erreur lors de la validation');
      }
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Etes-vous sur de vouloir annuler ce paiement ?')) {
      try {
        await cancelPayment(id).unwrap();
        toast.success('Paiement annule avec succes');
      } catch (err) {
        toast.error(err.data?.message || 'Erreur lors de l\'annulation');
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
        Erreur lors du chargement du paiement: {error.data?.message || error.message}
      </Alert>
    );
  }

  const payment = data?.data;

  if (!payment) {
    return <Alert variant="warning">Paiement non trouve</Alert>;
  }

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'brouillon':
        return <Badge bg="secondary">Brouillon</Badge>;
      case 'valide':
        return <Badge bg="success">Valide</Badge>;
      case 'annule':
        return <Badge bg="danger">Annule</Badge>;
      default:
        return <Badge bg="light">{statut}</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    return type === 'client' ? (
      <Badge bg="primary">Client</Badge>
    ) : (
      <Badge bg="warning">Fournisseur</Badge>
    );
  };

  const getModeLabel = (mode) => {
    const labels = {
      especes: 'Especes',
      cheque: 'Cheque',
      virement: 'Virement',
      orange_money: 'Orange Money',
      wave: 'Wave',
      carte_bancaire: 'Carte bancaire',
    };
    return labels[mode] || mode;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <Button variant="outline-secondary" onClick={() => navigate('/paiements')} className="mb-2">
            <FiArrowLeft className="me-2" />
            Retour
          </Button>
          <h1>
            Paiement {payment.numero} {getStatutBadge(payment.statut)}
          </h1>
        </div>
        <div className="d-flex gap-2">
          {payment.statut === 'brouillon' && (
            <>
              <Button
                variant="outline-primary"
                onClick={() => navigate(`/paiements/${payment._id}/modifier`)}
              >
                <FiEdit2 className="me-2" />
                Modifier
              </Button>
              <Button variant="success" onClick={handleValidate} disabled={isValidating}>
                {isValidating ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Validation...
                  </>
                ) : (
                  <>
                    <FiCheck className="me-2" />
                    Valider
                  </>
                )}
              </Button>
            </>
          )}
          {payment.statut === 'valide' && (
            <Button variant="danger" onClick={handleCancel} disabled={isCanceling}>
              {isCanceling ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Annulation...
                </>
              ) : (
                <>
                  <FiX className="me-2" />
                  Annuler
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Row className="g-3">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Informations du Paiement</h5>
            </Card.Header>
            <Card.Body>
              <Table bordered>
                <tbody>
                  <tr>
                    <th width="30%">Numero</th>
                    <td>{payment.numero}</td>
                  </tr>
                  <tr>
                    <th>Type</th>
                    <td>{getTypeBadge(payment.typePaiement)}</td>
                  </tr>
                  <tr>
                    <th>
                      {payment.typePaiement === 'client' ? 'Client' : 'Fournisseur'}
                    </th>
                    <td>
                      {payment.client
                        ? payment.client.type === 'entreprise'
                          ? payment.client.raisonSociale
                          : `${payment.client.firstName} ${payment.client.lastName}`
                        : payment.fournisseur?.nom || '-'}
                    </td>
                  </tr>
                  <tr>
                    <th>Montant</th>
                    <td>
                      <strong className="text-primary fs-5">{formatMoney(payment.montant)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <th>Mode de Paiement</th>
                    <td>{getModeLabel(payment.modePaiement)}</td>
                  </tr>
                  <tr>
                    <th>Date de Paiement</th>
                    <td>{formatDate(payment.datePaiement)}</td>
                  </tr>
                  {payment.facture && (
                    <tr>
                      <th>Facture Liee</th>
                      <td>
                        <Button
                          variant="link"
                          className="p-0"
                          onClick={() => navigate(`/factures/${payment.facture._id}`)}
                        >
                          {payment.facture.numero}
                        </Button>
                      </td>
                    </tr>
                  )}
                  {payment.compteBancaire && (
                    <tr>
                      <th>Compte Bancaire</th>
                      <td>
                        {payment.compteBancaire.nom} - {payment.compteBancaire.numeroCompte}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <th>Statut</th>
                    <td>{getStatutBadge(payment.statut)}</td>
                  </tr>
                  {payment.notes && (
                    <tr>
                      <th>Notes</th>
                      <td>{payment.notes}</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {payment.modePaiement === 'cheque' && payment.detailsCheque && (
            <Card className="shadow-sm mt-3">
              <Card.Header>
                <h5 className="mb-0">Details du Cheque</h5>
              </Card.Header>
              <Card.Body>
                <Table bordered>
                  <tbody>
                    {payment.detailsCheque.numeroCheque && (
                      <tr>
                        <th width="30%">Numero Cheque</th>
                        <td>{payment.detailsCheque.numeroCheque}</td>
                      </tr>
                    )}
                    {payment.detailsCheque.banque && (
                      <tr>
                        <th>Banque</th>
                        <td>{payment.detailsCheque.banque}</td>
                      </tr>
                    )}
                    {payment.detailsCheque.dateEncaissement && (
                      <tr>
                        <th>Date Encaissement</th>
                        <td>{formatDate(payment.detailsCheque.dateEncaissement)}</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {['orange_money', 'wave'].includes(payment.modePaiement) && payment.detailsMobileMoney && (
            <Card className="shadow-sm mt-3">
              <Card.Header>
                <h5 className="mb-0">Details Mobile Money</h5>
              </Card.Header>
              <Card.Body>
                <Table bordered>
                  <tbody>
                    {payment.detailsMobileMoney.numeroTransaction && (
                      <tr>
                        <th width="30%">Numero Transaction</th>
                        <td>{payment.detailsMobileMoney.numeroTransaction}</td>
                      </tr>
                    )}
                    {payment.detailsMobileMoney.telephone && (
                      <tr>
                        <th>Telephone</th>
                        <td>{payment.detailsMobileMoney.telephone}</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {payment.modePaiement === 'virement' && payment.detailsVirement && (
            <Card className="shadow-sm mt-3">
              <Card.Header>
                <h5 className="mb-0">Details du Virement</h5>
              </Card.Header>
              <Card.Body>
                <Table bordered>
                  <tbody>
                    {payment.detailsVirement.numeroVirement && (
                      <tr>
                        <th width="30%">Numero Virement</th>
                        <td>{payment.detailsVirement.numeroVirement}</td>
                      </tr>
                    )}
                    {payment.detailsVirement.banqueEmettrice && (
                      <tr>
                        <th>Banque Emettrice</th>
                        <td>{payment.detailsVirement.banqueEmettrice}</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={4}>
          {payment.ecritureComptable && (
            <Card className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Ecriture Comptable</h5>
              </Card.Header>
              <Card.Body>
                <p>
                  <strong>Numero:</strong>{' '}
                  <Button
                    variant="link"
                    className="p-0"
                    onClick={() => navigate(`/comptabilite/ecritures/${payment.ecritureComptable._id}`)}
                  >
                    {payment.ecritureComptable.numero}
                  </Button>
                </p>
                <p>
                  <strong>Journal:</strong> {payment.ecritureComptable.journal}
                </p>
                <p>
                  <strong>Date:</strong> {formatDate(payment.ecritureComptable.dateEcriture)}
                </p>
              </Card.Body>
            </Card>
          )}

          <Card className="shadow-sm mt-3">
            <Card.Header>
              <h5 className="mb-0">Informations Systeme</h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-2">
                <small className="text-muted">Cree le:</small>
                <br />
                {formatDate(payment.createdAt)}
              </p>
              {payment.createdBy && (
                <p className="mb-2">
                  <small className="text-muted">Cree par:</small>
                  <br />
                  {payment.createdBy.firstName} {payment.createdBy.lastName}
                </p>
              )}
              {payment.updatedAt && (
                <p className="mb-2">
                  <small className="text-muted">Modifie le:</small>
                  <br />
                  {formatDate(payment.updatedAt)}
                </p>
              )}
              {payment.validatedBy && (
                <p className="mb-0">
                  <small className="text-muted">Valide par:</small>
                  <br />
                  {payment.validatedBy.firstName} {payment.validatedBy.lastName}
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default PaymentDetailPage;
