import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { Link } from 'react-router-dom';
import {
  FiUsers, FiCalendar, FiDollarSign, FiUserCheck, FiUserX, FiClock, FiPlus,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import { useGetStatsRHQuery, useGetCongesStatsQuery } from '../../redux/api/rhApi';

const TYPE_LABELS = {
  conge_annuel: 'Congé annuel',
  maladie: 'Maladie',
  maternite: 'Maternité',
  paternite: 'Paternité',
  sans_solde: 'Sans solde',
  autre: 'Autre',
};

const DEPT_COLORS = ['#1a56db', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const RHDashboardPage = () => {
  usePageTitle('Tableau de bord RH', [
    { label: 'Accueil', path: '/' },
    { label: 'RH', path: '/rh' },
    { label: 'Dashboard' },
  ]);

  const { data: statsData, isLoading: loadingStats } = useGetStatsRHQuery();
  const { data: congesData, isLoading: loadingConges } = useGetCongesStatsQuery();

  const stats   = statsData?.data  || {};
  const cStats  = congesData?.data || {};

  if (loadingStats || loadingConges) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  }

  const pieData = (stats.parContrat || []).map((c) => ({ name: c._id, value: c.count }));
  const PIE_COLORS = ['#1a56db', '#059669', '#f59e0b', '#8b5cf6'];

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="mb-0">Ressources Humaines</h1>
            <small className="text-muted">Vue d'ensemble de votre effectif</small>
          </div>
          <div className="d-flex gap-2">
            <Link to="/rh/conges/nouveau" className="btn btn-outline-primary btn-sm">
              <FiCalendar className="me-1" />Demande congé
            </Link>
            <Link to="/rh/employes/nouveau" className="btn btn-primary btn-sm">
              <FiPlus className="me-1" />Nouvel employé
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <Row className="g-3 mb-4">
        {[
          { label: 'Employés actifs',     val: stats.totalActifs || 0,    icon: FiUsers,     color: '#1a56db' },
          { label: 'En congé ce mois',    val: cStats.approuvesMois || 0, icon: FiCalendar,  color: '#059669' },
          { label: 'Demandes en attente', val: cStats.enAttente || 0,     icon: FiClock,     color: '#f59e0b' },
          { label: 'Masse salariale',     val: formatMoney(stats.masseSalarialeBreute || 0), icon: FiDollarSign, color: '#8b5cf6', isMoney: true },
        ].map((k) => (
          <Col key={k.label} sm={6} xl={3}>
            <Card className="shadow-sm h-100">
              <Card.Body className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 48, height: 48, backgroundColor: `${k.color}20`, color: k.color }}>
                  <k.icon size={22} />
                </div>
                <div>
                  <div className="text-muted small">{k.label}</div>
                  <div className="fw-bold fs-5" style={{ color: k.color }}>
                    {k.isMoney ? k.val : k.val}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-3 mb-4">
        {/* Effectifs actifs / inactifs */}
        <Col md={3}>
          <Card className="shadow-sm h-100">
            <Card.Header><strong>Effectif global</strong></Card.Header>
            <Card.Body className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center gap-2">
                <FiUserCheck className="text-success" size={20} />
                <div>
                  <div className="fw-bold fs-5">{stats.totalActifs}</div>
                  <div className="text-muted small">Actifs</div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <FiUserX className="text-danger" size={20} />
                <div>
                  <div className="fw-bold fs-5">{stats.totalInactifs}</div>
                  <div className="text-muted small">Inactifs / Suspendus</div>
                </div>
              </div>
              <hr className="my-1" />
              <div className="small text-muted">
                Salaire moyen : <strong className="text-dark">{formatMoney(stats.salaireMoyen)}</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Répartition par type contrat */}
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Header><strong>Types de contrat</strong></Card.Header>
            <Card.Body>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, value }) => `${name} (${value})`}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted text-center small">Aucune donnée</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Répartition par département */}
        <Col md={5}>
          <Card className="shadow-sm h-100">
            <Card.Header><strong>Effectif par département</strong></Card.Header>
            <Card.Body className="p-0">
              {(stats.parDepartement || []).length === 0 ? (
                <p className="text-muted text-center small py-3">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.parDepartement} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="_id" width={90} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v} emp.`, 'Effectif']} />
                    <Bar dataKey="count" name="Effectif" radius={[0, 4, 4, 0]}>
                      {(stats.parDepartement || []).map((entry, i) => (
                        <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Masse salariale par département */}
      {(stats.parDepartement || []).length > 0 && (
        <Card className="shadow-sm mb-4">
          <Card.Header><strong>Masse salariale par département</strong></Card.Header>
          <Card.Body>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.parDepartement} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Bar dataKey="masseSalariale" name="Masse salariale" fill="#1a56db" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      )}

      {/* Congés par type */}
      {(cStats.parType || []).length > 0 && (
        <Card className="shadow-sm">
          <Card.Header><strong>Congés approuvés par type</strong></Card.Header>
          <Card.Body className="p-0">
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Type</th>
                  <th className="text-center">Demandes</th>
                  <th className="text-end">Total jours</th>
                </tr>
              </thead>
              <tbody>
                {cStats.parType.map((t) => (
                  <tr key={t._id}>
                    <td><Badge bg="secondary">{TYPE_LABELS[t._id] || t._id}</Badge></td>
                    <td className="text-center">{t.count}</td>
                    <td className="text-end fw-semibold">{t.total} j</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card.Body>
        </Card>
      )}

      {stats.totalActifs === 0 && (
        <Alert variant="info" className="text-center mt-3">
          Aucun employé actif.{' '}
          <Link to="/rh/employes/nouveau">Ajouter le premier employé →</Link>
        </Alert>
      )}
    </>
  );
};

export default RHDashboardPage;
