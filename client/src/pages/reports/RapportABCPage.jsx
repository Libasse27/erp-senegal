import React, { useState, useMemo } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import { useGetRapportABCQuery } from '../../redux/api/rapportsApi';

const CLASS_COLORS = { A: '#059669', B: '#f59e0b', C: '#ef4444' };
const CLASS_BADGE  = { A: 'success', B: 'warning', C: 'danger' };

const RapportABCPage = () => {
  usePageTitle('Analyse ABC (Pareto)', [
    { label: 'Accueil', path: '/' },
    { label: 'Rapports', path: '/rapports' },
    { label: 'Analyse ABC' },
  ]);

  const currentYear = new Date().getFullYear();
  const [dateFrom, setDateFrom] = useState(`${currentYear}-01-01`);
  const [dateTo, setDateTo]     = useState(`${currentYear}-12-31`);
  const [type, setType]         = useState('clients');
  const [params, setParams]     = useState({ dateFrom: `${currentYear}-01-01`, dateTo: `${currentYear}-12-31`, type: 'clients' });

  const { data, isLoading, isError } = useGetRapportABCQuery(params);
  const rapport = useMemo(() => data?.data || null, [data]);

  const handleApply = () => setParams({ dateFrom, dateTo, type });

  const items  = rapport?.items || [];
  const kpis   = rapport?.kpis || {};

  // Show only top 30 in chart to keep it readable
  const chartData = items.slice(0, 30);

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/rapports" className="btn btn-sm btn-outline-secondary"><FiArrowLeft /></Link>
          <div>
            <h1 className="mb-0">Analyse ABC — Loi de Pareto</h1>
            <small className="text-muted">Classez vos {type === 'clients' ? 'clients' : 'produits'} par contribution au CA</small>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Label className="small fw-semibold">Analyser</Form.Label>
              <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="clients">Clients</option>
                <option value="produits">Produits</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">Date début</Form.Label>
              <Form.Control type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">Date fin</Form.Label>
              <Form.Control type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </Col>
            <Col md="auto">
              <Button variant="primary" onClick={handleApply}>Appliquer</Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {isLoading && <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>}
      {isError   && <Alert variant="danger">Erreur lors du chargement.</Alert>}

      {rapport && (
        <>
          {/* Résumé ABC */}
          <Row className="g-3 mb-4">
            {['A', 'B', 'C'].map((cls) => {
              const nb  = kpis[`nb${cls}`] || 0;
              const pct = kpis.nbItems > 0 ? Math.round((nb / kpis.nbItems) * 100) : 0;
              const caA = items.filter((i) => i.classe === cls).reduce((s, i) => s + i.totalCA, 0);
              return (
                <Col key={cls} md={4}>
                  <Card className="shadow-sm h-100 border-0" style={{ borderLeft: `4px solid ${CLASS_COLORS[cls]}` }}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="fw-bold fs-4" style={{ color: CLASS_COLORS[cls] }}>Classe {cls}</span>
                        <Badge bg={CLASS_BADGE[cls]} pill style={{ fontSize: '0.85rem' }}>{nb} {type}</Badge>
                      </div>
                      <div className="text-muted small mb-1">{pct}% des {type} → {formatMoney(caA)} de CA</div>
                      <div className="small">
                        {cls === 'A' && '80% du CA — clients/produits prioritaires'}
                        {cls === 'B' && '15% du CA — potentiel de développement'}
                        {cls === 'C' && '5% du CA — faible contribution'}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* Graphique Pareto (top 30) */}
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <strong>Courbe de Pareto — Top {Math.min(30, items.length)} {type}</strong>
            </Card.Header>
            <Card.Body>
              {chartData.length === 0 ? (
                <p className="text-muted text-center py-4">Aucune donnée sur la période</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="designation" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis yAxisId="bar" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="line" orientation="right" unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip formatter={(v, name) => name === '% cumulatif' ? `${v}%` : formatMoney(v)} />
                    <ReferenceLine yAxisId="line" y={80} stroke="#059669" strokeDasharray="4 4" label={{ value: '80%', position: 'right', fontSize: 11, fill: '#059669' }} />
                    <Bar yAxisId="bar" dataKey="totalCA" name="CA" fill="#1a56db" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>

          {/* Tableau complet */}
          <Card className="shadow-sm">
            <Card.Header><strong>Classement complet des {type} — {kpis.nbItems} éléments</strong></Card.Header>
            <Card.Body className="p-0" style={{ maxHeight: 500, overflowY: 'auto' }}>
              <Table hover size="sm" className="mb-0" stickyHeader>
                <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
                  <tr>
                    <th>#</th>
                    <th>Classe</th>
                    <th>{type === 'clients' ? 'Client' : 'Produit'}</th>
                    <th className="text-end">CA</th>
                    <th className="text-end">% CA</th>
                    <th className="text-end">% Cumulatif</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className={item.classe === 'A' ? 'table-success' : item.classe === 'B' ? 'table-warning' : ''} style={{ opacity: item.classe === 'C' ? 0.7 : 1 }}>
                      <td className="text-muted small">{i + 1}</td>
                      <td><Badge bg={CLASS_BADGE[item.classe]}>{item.classe}</Badge></td>
                      <td className="fw-medium small">{item.designation}</td>
                      <td className="text-end small fw-semibold">{formatMoney(item.totalCA)}</td>
                      <td className="text-end small">{item.pct}%</td>
                      <td className="text-end small">{item.pctCumulatif}%</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}
    </>
  );
};

export default RapportABCPage;
