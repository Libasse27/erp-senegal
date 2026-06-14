import React, { useState } from 'react';
import {
  Card, Table, Badge, Button, Spinner, Alert, Modal,
} from 'react-bootstrap';
import {
  FiArchive, FiDownload, FiTrash2, FiRefreshCw,
  FiPlus, FiCheckCircle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import {
  useListBackupsQuery,
  useCreateBackupMutation,
  useDeleteBackupMutation,
} from '../../redux/api/superAdminApi';

const BackupManagementPage = () => {
  const [deleteModal, setDeleteModal] = useState({ show: false, filename: null });

  const { data, isLoading, isError, refetch } = useListBackupsQuery();
  const [createBackup, { isLoading: creating }] = useCreateBackupMutation();
  const [deleteBackup, { isLoading: deleting }] = useDeleteBackupMutation();

  const backups = data?.data || [];

  const handleCreate = async () => {
    try {
      const result = await createBackup().unwrap();
      toast.success(`Sauvegarde créée : ${result.data?.filename}`);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la sauvegarde.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBackup(deleteModal.filename).unwrap();
      toast.success('Sauvegarde supprimée.');
      setDeleteModal({ show: false, filename: null });
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const handleDownload = (filename) => {
    const token = localStorage.getItem('accessToken') || '';
    const url = `/api/super-admin/backups/${encodeURIComponent(filename)}/download`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1"><FiArchive className="me-2" />Sauvegardes</h4>
          <p className="text-muted mb-0 small">
            {backups.length} sauvegarde(s) disponible(s)
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={refetch}>
            <FiRefreshCw size={14} className="me-1" /> Actualiser
          </Button>
          <Button variant="success" size="sm" onClick={handleCreate} disabled={creating}>
            {creating
              ? <><Spinner size="sm" className="me-1" />Sauvegarde en cours...</>
              : <><FiPlus size={14} className="me-1" />Nouvelle sauvegarde</>
            }
          </Button>
        </div>
      </div>

      {/* Info */}
      <Alert variant="info" className="small mb-3">
        <FiCheckCircle className="me-2" />
        Les sauvegardes incluent les collections : utilisateurs, rôles, permissions, clients, fournisseurs et produits.
        Le fichier JSON est chiffré lors du téléchargement.
      </Alert>

      {isLoading && <div className="text-center py-5"><Spinner /></div>}
      {isError && <Alert variant="danger">Impossible de charger la liste des sauvegardes.</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Fichier</th>
                <th>Taille</th>
                <th>Date de création</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="text-center py-5 text-muted">
                    <FiArchive size={32} className="d-block mx-auto mb-2 opacity-25" />
                    Aucune sauvegarde disponible. Cliquez sur «Nouvelle sauvegarde» pour commencer.
                  </td>
                </tr>
              )}
              {backups.map((b) => (
                <tr key={b.filename}>
                  <td>
                    <code className="small">{b.filename}</code>
                  </td>
                  <td>
                    <Badge bg="light" text="dark">{b.sizeHuman}</Badge>
                  </td>
                  <td className="small text-muted">
                    {new Date(b.createdAt).toLocaleString('fr-SN')}
                  </td>
                  <td>
                    <div className="d-flex gap-1 justify-content-end">
                      <Button
                        size="sm" variant="outline-primary"
                        title="Télécharger"
                        onClick={() => handleDownload(b.filename)}
                      >
                        <FiDownload size={13} />
                      </Button>
                      <Button
                        size="sm" variant="outline-danger"
                        title="Supprimer"
                        onClick={() => setDeleteModal({ show: true, filename: b.filename })}
                      >
                        <FiTrash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal de confirmation suppression */}
      <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, filename: null })} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-1">Supprimer cette sauvegarde ?</p>
          <code className="small">{deleteModal.filename}</code>
          <Alert variant="danger" className="mt-2 small mb-0">
            Cette action est irréversible.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setDeleteModal({ show: false, filename: null })}>Annuler</Button>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" className="me-1" /> : null}
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BackupManagementPage;
