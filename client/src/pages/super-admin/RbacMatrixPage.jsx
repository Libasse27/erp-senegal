import React, { useState } from 'react';
import { Card, Table, Badge, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { FiShield, FiSearch, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { useGetRbacMatrixQuery } from '../../redux/api/superAdminApi';

const RoleBadge = ({ name, isProtected }) => {
  const colors = { super_admin: 'danger', admin: 'dark', manager: 'primary' };
  return (
    <span className="d-flex align-items-center gap-1">
      <Badge bg={colors[name] || 'secondary'}>{name}</Badge>
      {isProtected && <Badge bg="danger" className="small">Protégé</Badge>}
    </span>
  );
};

const RbacMatrixPage = () => {
  const [moduleFilter, setModuleFilter] = useState('');
  const { data, isLoading, isError, refetch } = useGetRbacMatrixQuery();

  const matrix = data?.data?.matrix || [];
  const allPermissions = data?.data?.allPermissions || [];

  const modules = [...new Set(allPermissions.map((p) => p.module))].sort();
  const filteredPermissions = moduleFilter
    ? allPermissions.filter((p) => p.module === moduleFilter)
    : allPermissions;

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1"><FiShield className="me-2" />Matrice RBAC</h4>
          <p className="text-muted mb-0 small">
            {matrix.length} rôles — {allPermissions.length} permissions totales
          </p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={refetch}>
          <FiRefreshCw size={14} className="me-1" /> Actualiser
        </button>
      </div>

      {/* Filtre par module */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-2">
          <InputGroup size="sm" style={{ maxWidth: '300px' }}>
            <InputGroup.Text><FiSearch /></InputGroup.Text>
            <Form.Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
              <option value="">Tous les modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Form.Select>
          </InputGroup>
        </Card.Body>
      </Card>

      {isLoading && <div className="text-center py-5"><Spinner /></div>}
      {isError && <Alert variant="danger">Impossible de charger la matrice RBAC.</Alert>}

      {!isLoading && matrix.length > 0 && (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div style={{ overflowX: 'auto' }}>
              <Table bordered size="sm" className="mb-0" style={{ minWidth: '600px' }}>
                <thead className="table-dark">
                  <tr>
                    <th style={{ minWidth: '200px' }}>Permission</th>
                    {matrix.map((entry) => (
                      <th key={entry.role.id} className="text-center" style={{ minWidth: '120px' }}>
                        <RoleBadge name={entry.role.name} isProtected={entry.role.isProtected} />
                        <div className="small mt-1 text-white-50">{entry.permissionCount} perms</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPermissions.map((perm) => (
                    <tr key={perm.id}>
                      <td>
                        <code className="small">{perm.code}</code>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {perm.module} › {perm.action}
                        </div>
                      </td>
                      {matrix.map((entry) => {
                        const has = entry.permissions.includes(perm.code);
                        return (
                          <td key={entry.role.id} className="text-center">
                            {has
                              ? <FiCheck className="text-success" size={16} />
                              : <FiX className="text-danger" size={14} />
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default RbacMatrixPage;
