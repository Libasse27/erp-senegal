import React, { useState } from 'react';
import {
  Card, Table, Badge, Button, Form, InputGroup, Spinner,
  Modal, Alert, Row, Col,
} from 'react-bootstrap';
import {
  FiSearch, FiUsers, FiLogOut, FiUnlock, FiKey,
  FiRefreshCw, FiShield, FiEdit2,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import {
  useGetAllUsersAdminQuery,
  useForceLogoutUserMutation,
  useUnlockUserAccountMutation,
  useResetUserPasswordMutation,
  useChangeUserRoleMutation,
} from '../../redux/api/superAdminApi';
import { useGetRolesQuery } from '../../redux/api/adminApi';

const RoleBadge = ({ name }) => {
  const colors = {
    super_admin: 'danger',
    admin: 'dark',
    manager: 'primary',
    comptable: 'success',
    commercial: 'warning',
    vendeur: 'info',
    caissier: 'secondary',
    gestionnaire_stock: 'light',
  };
  return (
    <Badge bg={colors[name] || 'secondary'} text={name === 'gestionnaire_stock' ? 'dark' : undefined}>
      {name}
    </Badge>
  );
};

const SuperAdminUsersPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showInactive, setShowInactive] = useState(true);

  const [resetModal, setResetModal] = useState({ show: false, user: null });
  const [roleModal, setRoleModal] = useState({ show: false, user: null });
  const [newPassword, setNewPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const params = {
    page,
    limit: 20,
    ...(search && { search }),
    ...(showInactive && { includeDeleted: true }),
  };

  const { data, isLoading, refetch } = useGetAllUsersAdminQuery(params);
  const { data: rolesData } = useGetRolesQuery();
  const [forceLogout, { isLoading: loggingOut }] = useForceLogoutUserMutation();
  const [unlockAccount, { isLoading: unlocking }] = useUnlockUserAccountMutation();
  const [resetPassword, { isLoading: resetting }] = useResetUserPasswordMutation();
  const [changeRole, { isLoading: changingRole }] = useChangeUserRoleMutation();

  const users = data?.data || [];
  const pagination = data?.pagination;

  const handleForceLogout = async (user) => {
    if (!window.confirm(`Forcer la déconnexion de ${user.firstName} ${user.lastName} ?`)) return;
    try {
      await forceLogout(user._id).unwrap();
      toast.success('Utilisateur déconnecté avec succès.');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la déconnexion.');
    }
  };

  const handleUnlock = async (user) => {
    try {
      await unlockAccount(user._id).unwrap();
      toast.success('Compte réactivé avec succès.');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la réactivation.');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.warn('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    try {
      await resetPassword({ id: resetModal.user._id, newPassword }).unwrap();
      toast.success('Mot de passe réinitialisé avec succès.');
      setResetModal({ show: false, user: null });
      setNewPassword('');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la réinitialisation.');
    }
  };

  const handleChangeRole = async () => {
    if (!selectedRole) return;
    try {
      await changeRole({ id: roleModal.user._id, roleId: selectedRole }).unwrap();
      toast.success('Rôle mis à jour avec succès.');
      setRoleModal({ show: false, user: null });
      setSelectedRole('');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors du changement de rôle.');
    }
  };

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 className="fw-bold mb-0"><FiUsers className="me-2" />Gestion des Utilisateurs</h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={refetch}>
          <FiRefreshCw size={14} className="me-1" /> Actualiser
        </button>
      </div>

      {/* Filtres */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col xs={12} md={6}>
              <InputGroup size="sm">
                <InputGroup.Text><FiSearch /></InputGroup.Text>
                <Form.Control
                  placeholder="Rechercher un utilisateur..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </InputGroup>
            </Col>
            <Col xs="auto">
              <Form.Check
                type="switch"
                label="Inclure les comptes désactivés"
                checked={showInactive}
                onChange={(e) => { setShowInactive(e.target.checked); setPage(1); }}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tableau */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5"><Spinner /></div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Dernière connexion</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-4 text-muted">Aucun utilisateur trouvé.</td></tr>
                )}
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="fw-medium">{u.firstName} {u.lastName}</div>
                      {u.phone && <div className="text-muted small">{u.phone}</div>}
                    </td>
                    <td className="small">{u.email}</td>
                    <td><RoleBadge name={u.role?.name} /></td>
                    <td>
                      <Badge bg={u.isActive ? 'success' : 'danger'}>
                        {u.isActive ? 'Actif' : 'Désactivé'}
                      </Badge>
                    </td>
                    <td className="small text-muted">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString('fr-SN') : '—'}
                    </td>
                    <td>
                      <div className="d-flex gap-1 justify-content-end">
                        {u.role?.name !== 'super_admin' && (
                          <>
                            <Button
                              size="sm" variant="outline-warning"
                              title="Forcer la déconnexion"
                              onClick={() => handleForceLogout(u)}
                              disabled={loggingOut}
                            >
                              <FiLogOut size={13} />
                            </Button>

                            {!u.isActive && (
                              <Button
                                size="sm" variant="outline-success"
                                title="Réactiver le compte"
                                onClick={() => handleUnlock(u)}
                                disabled={unlocking}
                              >
                                <FiUnlock size={13} />
                              </Button>
                            )}

                            <Button
                              size="sm" variant="outline-danger"
                              title="Réinitialiser le mot de passe"
                              onClick={() => { setResetModal({ show: true, user: u }); setNewPassword(''); }}
                            >
                              <FiKey size={13} />
                            </Button>

                            <Button
                              size="sm" variant="outline-primary"
                              title="Changer le rôle"
                              onClick={() => {
                                setRoleModal({ show: true, user: u });
                                setSelectedRole(u.role?._id || '');
                              }}
                            >
                              <FiEdit2 size={13} />
                            </Button>
                          </>
                        )}
                        {u.role?.name === 'super_admin' && (
                          <Badge bg="danger"><FiShield size={11} className="me-1" />Protégé</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
        {pagination && pagination.totalPages > 1 && (
          <Card.Footer className="bg-transparent border-0 d-flex align-items-center justify-content-between">
            <small className="text-muted">
              {pagination.total} utilisateur(s) — page {pagination.page}/{pagination.totalPages}
            </small>
            <div className="d-flex gap-1">
              <Button size="sm" variant="outline-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</Button>
              <Button size="sm" variant="outline-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>›</Button>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Modal Reset Password */}
      <Modal show={resetModal.show} onHide={() => setResetModal({ show: false, user: null })} centered>
        <Modal.Header closeButton>
          <Modal.Title><FiKey className="me-2" />Réinitialiser le mot de passe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="small">
            Cette action est irréversible. L'utilisateur <strong>{resetModal.user?.firstName} {resetModal.user?.lastName}</strong> sera
            immédiatement déconnecté de toutes ses sessions.
          </Alert>
          <Form.Group>
            <Form.Label>Nouveau mot de passe <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 caractères"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setResetModal({ show: false, user: null })}>Annuler</Button>
          <Button variant="danger" onClick={handleResetPassword} disabled={resetting}>
            {resetting ? <Spinner size="sm" className="me-1" /> : null}
            Réinitialiser
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Change Role */}
      <Modal show={roleModal.show} onHide={() => setRoleModal({ show: false, user: null })} centered>
        <Modal.Header closeButton>
          <Modal.Title><FiEdit2 className="me-2" />Changer le rôle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Rôle pour <strong>{roleModal.user?.firstName} {roleModal.user?.lastName}</strong></Form.Label>
            <Form.Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
              <option value="">-- Sélectionner un rôle --</option>
              {(rolesData?.data || [])
                .filter((r) => r.name !== 'super_admin')
                .map((r) => (
                  <option key={r._id} value={r._id}>{r.displayName} ({r.name})</option>
                ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRoleModal({ show: false, user: null })}>Annuler</Button>
          <Button variant="primary" onClick={handleChangeRole} disabled={changingRole || !selectedRole}>
            {changingRole ? <Spinner size="sm" className="me-1" /> : null}
            Mettre à jour
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SuperAdminUsersPage;
