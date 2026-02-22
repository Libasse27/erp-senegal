import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import BsPagination from 'react-bootstrap/Pagination';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { ROLES } from '../../utils/constants';
import { useGetUsersQuery, useDeleteUserMutation } from '../../redux/api/usersApi';

const ROLE_VARIANTS = {
  admin: 'danger',
  manager: 'primary',
  comptable: 'info',
  commercial: 'success',
  vendeur: 'warning',
  caissier: 'secondary',
  gestionnaire_stock: 'dark',
};

export default function UsersListPage() {
  usePageTitle('Utilisateurs', [
    { label: 'Accueil', path: '/' },
    { label: 'Administration' },
    { label: 'Utilisateurs' },
  ]);

  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: '',
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const { data, isLoading, isError, error } = useGetUsersQuery({
    page,
    limit,
    search: filters.search || undefined,
    role: filters.role || undefined,
    isActive: filters.isActive || undefined,
  });

  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(userToDelete._id).unwrap();
      toast.success('Utilisateur supprime avec succes');
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const users = data?.data || [];
  const meta = data?.meta || {};
  const totalPages = meta.totalPages || 1;

  return (
    <div className="users-list-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <FiUsers className="me-2" />
            Utilisateurs
          </h2>
          <p className="text-muted mb-0">Gestion des utilisateurs du systeme</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/admin/utilisateurs/nouveau')}>
          <FiPlus className="me-2" />
          Nouvel Utilisateur
        </Button>
      </div>

      <Card>
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Rechercher</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type="text"
                    placeholder="Nom, prenom ou email..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                  <FiSearch
                    className="position-absolute top-50 end-0 translate-middle-y me-3"
                    style={{ pointerEvents: 'none' }}
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Role</Form.Label>
                <Form.Select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <option value="">Tous les roles</option>
                  {Object.entries(ROLES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Statut</Form.Label>
                <Form.Select
                  value={filters.isActive}
                  onChange={(e) => handleFilterChange('isActive', e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  <option value="true">Actif</option>
                  <option value="false">Inactif</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {isLoading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des utilisateurs...</p>
            </div>
          )}

          {isError && (
            <Alert variant="danger">
              Erreur lors du chargement des utilisateurs: {error?.data?.message || error?.message}
            </Alert>
          )}

          {!isLoading && !isError && (
            <>
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th>Nom Complet</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Statut</th>
                    <th>Derniere Connexion</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        Aucun utilisateur trouve
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td>
                          {user.firstName} {user.lastName}
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <Badge bg={ROLE_VARIANTS[user.role] || 'secondary'}>
                            {ROLES[user.role] || user.role}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={user.isActive ? 'success' : 'danger'}>
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td>{user.lastLogin ? formatDateTime(user.lastLogin) : 'Jamais'}</td>
                        <td className="text-center">
                          <Button
                            variant="link"
                            size="sm"
                            className="text-primary p-1"
                            onClick={() => navigate(`/admin/utilisateurs/${user._id}/modifier`)}
                            title="Modifier"
                          >
                            <FiEdit2 />
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-danger p-1"
                            onClick={() => handleDeleteClick(user)}
                            title="Supprimer"
                          >
                            <FiTrash2 />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>

              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Page {page} sur {totalPages} ({meta.total || 0} utilisateur(s))
                  </div>
                  <BsPagination>
                    <BsPagination.Prev disabled={page === 1} onClick={() => setPage(page - 1)} />
                    {[...Array(totalPages)].map((_, idx) => {
                      const pageNum = idx + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= page - 1 && pageNum <= page + 1)
                      ) {
                        return (
                          <BsPagination.Item
                            key={pageNum}
                            active={pageNum === page}
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </BsPagination.Item>
                        );
                      } else if (pageNum === page - 2 || pageNum === page + 2) {
                        return <BsPagination.Ellipsis key={pageNum} disabled />;
                      }
                      return null;
                    })}
                    <BsPagination.Next
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    />
                  </BsPagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Etes-vous sur de vouloir supprimer l'utilisateur{' '}
          <strong>
            {userToDelete?.firstName} {userToDelete?.lastName}
          </strong>{' '}
          ?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={isDeleting}>
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
