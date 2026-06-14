import React, { useState, useEffect, useRef } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { FiShield, FiPlus, FiSave, FiTrash2, FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import {
  useGetRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
} from '../../redux/api/adminApi';

const ACTIONS = ['create', 'read', 'update', 'delete', 'export', 'validate'];

const ACTION_LABELS = {
  create:   'Créer',
  read:     'Lire',
  update:   'Modifier',
  delete:   'Supprimer',
  export:   'Exporter',
  validate: 'Valider',
};

const ACTION_COLORS = {
  create:   'success',
  read:     'info',
  update:   'warning',
  delete:   'danger',
  export:   'secondary',
  validate: 'primary',
};

const MODULE_LABELS = {
  clients:        'Clients',
  suppliers:      'Fournisseurs',
  products:       'Produits',
  stocks:         'Stocks',
  quotes:         'Devis',
  invoices:       'Factures',
  commandes:      'Commandes',
  payments:       'Paiements',
  comptabilite:   'Comptabilité',
  ecritures:      'Ecritures',
  reports:        'Rapports',
  settings:       'Paramètres',
  users:          'Utilisateurs',
  roles:          'Rôles',
  audit:          "Journal d'Audit",
  bank_accounts:  'Comptes Bancaires',
  warehouse:      'Entrepôts',
};

function IndeterminateCheckbox({ checked, indeterminate, onChange, disabled }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <Form.Check
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="d-inline-block"
    />
  );
}

export default function RolesPage() {
  usePageTitle('Rôles & Permissions', [
    { label: 'Accueil', path: '/' },
    { label: 'Administration' },
    { label: 'Rôles & Permissions' },
  ]);

  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [localPermIds, setLocalPermIds] = useState(new Set());
  const [isDirty, setIsDirty] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', displayName: '', description: '' });

  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery({ limit: 100 });
  const { data: roleData, isFetching: roleFetching } = useGetRoleQuery(selectedRoleId, {
    skip: !selectedRoleId,
  });
  const { data: permsData, isLoading: permsLoading } = useGetPermissionsQuery();

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

  const roles = rolesData?.data || [];
  const selectedRole = roleData?.data || null;
  const groupedPerms = permsData?.grouped || {};
  const modules = Object.keys(groupedPerms).sort();

  const findPerm = (mod, action) =>
    (groupedPerms[mod] || []).find((p) => p.action === action);

  // Sync perm set when selected role changes
  useEffect(() => {
    if (selectedRole) {
      setLocalPermIds(new Set(selectedRole.permissions.map((p) => p._id || p)));
      setIsDirty(false);
    }
  }, [selectedRole]);

  const confirmRoleChange = (id) => {
    if (isDirty && !window.confirm('Modifications non sauvegardées. Changer quand même ?')) return;
    setSelectedRoleId(id);
  };

  const handleToggle = (permId) => {
    if (selectedRole?.isSystem) return;
    setLocalPermIds((prev) => {
      const next = new Set(prev);
      next.has(permId) ? next.delete(permId) : next.add(permId);
      return next;
    });
    setIsDirty(true);
  };

  const handleToggleModule = (mod) => {
    if (selectedRole?.isSystem) return;
    const modPerms = groupedPerms[mod] || [];
    const modIds = modPerms.map((p) => p._id);
    const allChecked = modIds.every((id) => localPermIds.has(id));
    setLocalPermIds((prev) => {
      const next = new Set(prev);
      modIds.forEach((id) => (allChecked ? next.delete(id) : next.add(id)));
      return next;
    });
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateRole({ id: selectedRoleId, permissions: [...localPermIds] }).unwrap();
      toast.success('Permissions mises à jour avec succès');
      setIsDirty(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleCreateSubmit = async () => {
    if (!newRole.name.trim() || !newRole.displayName.trim()) {
      toast.error("Le nom et le nom d'affichage sont requis");
      return;
    }
    try {
      const res = await createRole(newRole).unwrap();
      toast.success('Rôle créé avec succès');
      setShowCreateModal(false);
      setNewRole({ name: '', displayName: '', description: '' });
      setSelectedRoleId(res.data._id);
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteRole(selectedRoleId).unwrap();
      toast.success('Rôle supprimé avec succès');
      setShowDeleteModal(false);
      setSelectedRoleId(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Impossible de supprimer ce rôle');
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="roles-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <FiShield className="me-2" />
            Rôles &amp; Permissions
          </h2>
          <p className="text-muted mb-0">
            Gérer les rôles et configurer les droits d'accès par module
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <FiPlus className="me-2" />
          Nouveau rôle
        </Button>
      </div>

      <Row className="g-4">
        {/* ── Liste des rôles ── */}
        <Col lg={3}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Rôles ({roles.length})</h6>
            </Card.Header>
            <Card.Body className="p-0">
              {rolesLoading ? (
                <div className="text-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {roles.map((role) => (
                    <button
                      key={role._id}
                      type="button"
                      className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 ${
                        selectedRoleId === role._id ? 'active' : ''
                      }`}
                      onClick={() => confirmRoleChange(role._id)}
                    >
                      <div>
                        <div className="fw-semibold small">{role.displayName}</div>
                        <div
                          className={selectedRoleId === role._id ? 'text-white-50' : 'text-muted'}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {role.permissions?.length || 0} permission(s)
                        </div>
                      </div>
                      {role.isSystem && (
                        <Badge bg="danger" className="small ms-1 flex-shrink-0">
                          <FiLock size={9} className="me-1" />
                          Sys
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* ── Matrice des permissions ── */}
        <Col lg={9}>
          {!selectedRoleId ? (
            <Card className="shadow-sm">
              <Card.Body className="text-center py-5 text-muted">
                <FiShield size={48} className="mb-3 opacity-25" />
                <p className="mb-0">Sélectionnez un rôle pour configurer ses permissions</p>
              </Card.Body>
            </Card>
          ) : roleFetching || permsLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Card className="shadow-sm">
              <Card.Header className="bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h6 className="mb-0 fw-bold">{selectedRole?.displayName}</h6>
                  {selectedRole?.description && (
                    <small className="text-muted">{selectedRole.description}</small>
                  )}
                </div>
                <div className="d-flex gap-2 align-items-center flex-wrap">
                  {selectedRole?.isSystem && (
                    <Badge bg="warning" text="dark">
                      <FiLock size={11} className="me-1" />
                      Rôle système — lecture seule
                    </Badge>
                  )}
                  {isDirty && !selectedRole?.isSystem && (
                    <Badge bg="info">Modifications non sauvegardées</Badge>
                  )}
                  {!selectedRole?.isSystem && (
                    <>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        <FiTrash2 className="me-1" />
                        Supprimer
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSave}
                        disabled={!isDirty || isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <Spinner size="sm" className="me-1" />
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <FiSave className="me-1" />
                            Sauvegarder
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <div style={{ overflowX: 'auto' }}>
                  <table
                    className="table table-bordered table-hover mb-0"
                    style={{ minWidth: 500 }}
                  >
                    <thead className="table-light">
                      <tr>
                        <th style={{ minWidth: 160 }}>Module</th>
                        {ACTIONS.map((action) => (
                          <th
                            key={action}
                            className="text-center"
                            style={{ width: 88 }}
                          >
                            <Badge
                              bg={ACTION_COLORS[action]}
                              className="fw-normal"
                              style={{ fontSize: '0.7rem' }}
                            >
                              {ACTION_LABELS[action]}
                            </Badge>
                          </th>
                        ))}
                        <th className="text-center" style={{ width: 70 }}>
                          <span className="text-muted small">Tout</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((mod) => {
                        const modPerms = groupedPerms[mod] || [];
                        const modIds = modPerms.map((p) => p._id);
                        const allChecked = modIds.length > 0 && modIds.every((id) => localPermIds.has(id));
                        const someChecked = modIds.some((id) => localPermIds.has(id));

                        return (
                          <tr key={mod}>
                            <td className="fw-semibold small align-middle">
                              {MODULE_LABELS[mod] || mod}
                            </td>
                            {ACTIONS.map((action) => {
                              const perm = findPerm(mod, action);
                              if (!perm) {
                                return (
                                  <td
                                    key={action}
                                    className="text-center align-middle"
                                    style={{ backgroundColor: '#f8f9fa' }}
                                  >
                                    <span
                                      className="text-muted"
                                      style={{ fontSize: '0.65rem' }}
                                    >
                                      —
                                    </span>
                                  </td>
                                );
                              }
                              return (
                                <td key={action} className="text-center align-middle">
                                  <Form.Check
                                    type="checkbox"
                                    checked={localPermIds.has(perm._id)}
                                    onChange={() => handleToggle(perm._id)}
                                    disabled={selectedRole?.isSystem}
                                    className="d-inline-block"
                                  />
                                </td>
                              );
                            })}
                            <td className="text-center align-middle">
                              <IndeterminateCheckbox
                                checked={allChecked}
                                indeterminate={someChecked && !allChecked}
                                onChange={() => handleToggleModule(mod)}
                                disabled={selectedRole?.isSystem}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* ── Modal création de rôle ── */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FiPlus className="me-2" />
            Nouveau rôle
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>
              Nom technique <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="ex: responsable_achat"
              value={newRole.name}
              onChange={(e) =>
                setNewRole((p) => ({
                  ...p,
                  name: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                }))
              }
            />
            <Form.Text className="text-muted">Minuscules et underscores uniquement</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>
              Nom d'affichage <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="ex: Responsable Achat"
              value={newRole.displayName}
              onChange={(e) => setNewRole((p) => ({ ...p, displayName: e.target.value }))}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Description du rôle (optionnel)"
              value={newRole.description}
              onChange={(e) => setNewRole((p) => ({ ...p, description: e.target.value }))}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleCreateSubmit} disabled={isCreating}>
            {isCreating ? 'Création...' : 'Créer le rôle'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal confirmation suppression ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Supprimer le rôle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-0">
            Êtes-vous sûr de vouloir supprimer le rôle{' '}
            <strong>{selectedRole?.displayName}</strong> ?<br />
            Les utilisateurs ayant ce rôle devront être réassignés avant la suppression.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={isDeleting}>
            {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
