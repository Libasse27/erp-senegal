import React, { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import { useGetEmployesQuery, useDeleteEmployeMutation } from '../../redux/api/rhApi';

const STATUT_BADGE = {
  actif:     { bg: 'success',   label: 'Actif' },
  inactif:   { bg: 'secondary', label: 'Inactif' },
  conge:     { bg: 'info',      label: 'En congé' },
  suspendu:  { bg: 'danger',    label: 'Suspendu' },
};

const CONTRACT_BADGE = {
  CDI:       'primary',
  CDD:       'warning',
  Stage:     'info',
  Freelance: 'secondary',
};

const EmployesListPage = () => {
  usePageTitle('Employés', [
    { label: 'Accueil', path: '/' },
    { label: 'RH', path: '/rh' },
    { label: 'Employés' },
  ]);

  const [search, setSearch]         = useState('');
  const [statut, setStatut]         = useState('');
  const [departement, setDept]      = useState('');
  const [params, setParams]         = useState({});
  const [toDelete, setToDelete]     = useState(null);

  const { data, isLoading } = useGetEmployesQuery(params);
  const [deleteEmploye, { isLoading: deleting }] = useDeleteEmployeMutation();

  const employes = data?.data || [];

  const handleSearch = () => {
    setParams({
      ...(search      ? { search }      : {}),
      ...(statut      ? { statut }      : {}),
      ...(departement ? { departement } : {}),
    });
  };

  const handleReset = () => {
    setSearch(''); setStatut(''); setDept('');
    setParams({});
  };

  const handleDelete = async () => {
    try {
      await deleteEmploye(toDelete._id).unwrap();
      toast.success('Employé désactivé');
      setToDelete(null);
    } catch {
      toast.error('Erreur lors de la désactivation');
    }
  };

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="mb-0">Employés</h1>
            <small className="text-muted">{data?.total || 0} employé(s)</small>
          </div>
          <Link to="/rh/employes/nouveau" className="btn btn-primary">
            <FiPlus className="me-1" />Nouvel employé
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={4}>
              <Form.Label className="small fw-semibold">Rechercher</Form.Label>
              <div className="input-group">
                <span className="input-group-text"><FiSearch size={14} /></span>
                <Form.Control
                  placeholder="Nom, prénom, matricule, poste..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </Col>
            <Col md={2}>
              <Form.Label className="small fw-semibold">Statut</Form.Label>
              <Form.Select value={statut} onChange={(e) => setStatut(e.target.value)}>
                <option value="">Tous</option>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
                <option value="conge">En congé</option>
                <option value="suspendu">Suspendu</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">Département</Form.Label>
              <Form.Control
                placeholder="Ex: Commercial..."
                value={departement}
                onChange={(e) => setDept(e.target.value)}
              />
            </Col>
            <Col md="auto" className="d-flex gap-2">
              <Button variant="primary" onClick={handleSearch}>Filtrer</Button>
              <Button variant="outline-secondary" onClick={handleReset}>Réinitialiser</Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Liste */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>
          ) : employes.length === 0 ? (
            <p className="text-muted text-center py-5">Aucun employé trouvé.</p>
          ) : (
            <Table hover size="sm" className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Matricule</th>
                  <th>Nom & Prénom</th>
                  <th>Poste</th>
                  <th>Département</th>
                  <th>Contrat</th>
                  <th>Statut</th>
                  <th className="text-end">Salaire brut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {employes.map((e) => {
                  const sb = STATUT_BADGE[e.statut] || { bg: 'secondary', label: e.statut };
                  return (
                    <tr key={e._id}>
                      <td className="text-muted small font-monospace">{e.matricule}</td>
                      <td className="fw-medium">{e.prenom} {e.nom}</td>
                      <td className="small">{e.poste}</td>
                      <td className="small">{e.departement}</td>
                      <td>
                        <Badge bg={CONTRACT_BADGE[e.typeContrat] || 'secondary'} className="small">
                          {e.typeContrat}
                        </Badge>
                      </td>
                      <td><Badge bg={sb.bg}>{sb.label}</Badge></td>
                      <td className="text-end small fw-semibold">{formatMoney(e.salaireBrut)}</td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <Link to={`/rh/employes/${e._id}`} className="btn btn-link btn-sm p-0 text-muted">
                            <FiEye size={14} />
                          </Link>
                          <Link to={`/rh/employes/${e._id}/modifier`} className="btn btn-link btn-sm p-0 text-primary">
                            <FiEdit2 size={14} />
                          </Link>
                          {e.statut !== 'inactif' && (
                            <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => setToDelete(e)}>
                              <FiTrash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modale suppression */}
      <Modal show={!!toDelete} onHide={() => setToDelete(null)} centered size="sm">
        <Modal.Header closeButton><Modal.Title>Désactiver l'employé</Modal.Title></Modal.Header>
        <Modal.Body>
          <p>Désactiver <strong>{toDelete?.prenom} {toDelete?.nom}</strong> ({toDelete?.matricule}) ?</p>
          <p className="text-muted small mb-0">L'employé sera marqué inactif mais ses données seront conservées.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setToDelete(null)}>Annuler</Button>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" animation="border" /> : 'Désactiver'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EmployesListPage;
