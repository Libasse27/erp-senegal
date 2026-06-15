import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import { FiArrowLeft, FiEdit2, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import usePageTitle from '../../hooks/usePageTitle';
import { formatMoney } from '../../utils/formatters';
import {
  useGetEmployeQuery,
  useGetCongesQuery,
  useGetBulletinQuery,
  useGenererEcrituresPayrollMutation,
} from '../../redux/api/rhApi';

const STATUT_BADGE = {
  actif:     { bg: 'success',   label: 'Actif' },
  inactif:   { bg: 'secondary', label: 'Inactif' },
  conge:     { bg: 'info',      label: 'En congé' },
  suspendu:  { bg: 'danger',    label: 'Suspendu' },
};

const TYPE_LABELS = {
  conge_annuel: 'Congé annuel', maladie: 'Maladie', maternite: 'Maternité',
  paternite: 'Paternité', sans_solde: 'Sans solde', autre: 'Autre',
};

const STATUT_CONGE = { en_attente: 'warning', approuve: 'success', refuse: 'danger', annule: 'secondary' };

const EmployeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const now = new Date();
  const [bulletinPeriode, setBulletinPeriode] = useState({
    mois:  now.getMonth() + 1,
    annee: now.getFullYear(),
  });
  const [showBulletin, setShowBulletin] = useState(false);

  const { data, isLoading } = useGetEmployeQuery(id);
  const { data: congesData } = useGetCongesQuery({ employe: id, limit: 10 });
  const { data: bulletinData, isLoading: loadingBulletin } = useGetBulletinQuery(
    { id, mois: bulletinPeriode.mois, annee: bulletinPeriode.annee },
    { skip: !showBulletin }
  );
  const [genererEcritures, { isLoading: generatingEcritures }] = useGenererEcrituresPayrollMutation();

  const employe = data?.data;
  const conges  = congesData?.data || [];
  const bulletin = bulletinData?.data;

  usePageTitle(employe ? `${employe.prenom} ${employe.nom}` : 'Fiche employé', [
    { label: 'Accueil', path: '/' },
    { label: 'RH', path: '/rh' },
    { label: 'Employés', path: '/rh/employes' },
    { label: employe ? `${employe.prenom} ${employe.nom}` : '...' },
  ]);

  const handleGenererEcritures = async () => {
    try {
      await genererEcritures({ id, mois: bulletinPeriode.mois, annee: bulletinPeriode.annee }).unwrap();
      toast.success('Écritures de paie générées dans le journal OD');
    } catch (err) {
      toast.error(err?.data?.message || 'Erreur lors de la génération');
    }
  };

  if (isLoading) return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  if (!employe) return <Alert variant="danger">Employé non trouvé.</Alert>;

  const sb = STATUT_BADGE[employe.statut] || { bg: 'secondary', label: employe.statut };

  return (
    <>
      <div className="page-header mb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <Button variant="outline-secondary" size="sm" onClick={() => navigate('/rh/employes')}>
              <FiArrowLeft />
            </Button>
            <div>
              <h1 className="mb-0">{employe.prenom} {employe.nom}</h1>
              <small className="text-muted font-monospace">{employe.matricule}</small>
            </div>
          </div>
          <Link to={`/rh/employes/${id}/modifier`} className="btn btn-outline-primary btn-sm">
            <FiEdit2 className="me-1" />Modifier
          </Link>
        </div>
      </div>

      <Row className="g-3">
        {/* Fiche personnelle */}
        <Col lg={4}>
          <Card className="shadow-sm mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>Identité</strong>
              <Badge bg={sb.bg}>{sb.label}</Badge>
            </Card.Header>
            <Card.Body>
              {[
                ['Poste',       employe.poste],
                ['Département', employe.departement],
                ['Genre',       employe.genre === 'M' ? 'Masculin' : 'Féminin'],
                ['Nationalité', employe.nationalite],
                ['Téléphone',   employe.telephone || '—'],
                ['Email',       employe.email || '—'],
                ['Adresse',     employe.adresse || '—'],
              ].map(([label, val]) => (
                <div key={label} className="d-flex justify-content-between small py-1 border-bottom">
                  <span className="text-muted">{label}</span>
                  <span className="fw-medium text-end">{val}</span>
                </div>
              ))}
            </Card.Body>
          </Card>

          {/* Contrat */}
          <Card className="shadow-sm mb-3">
            <Card.Header><strong>Contrat</strong></Card.Header>
            <Card.Body>
              {[
                ['Type',      <Badge key="ct" bg="primary">{employe.typeContrat}</Badge>],
                ['Embauche',  employe.dateEmbauche ? new Date(employe.dateEmbauche).toLocaleDateString('fr-FR') : '—'],
                ['Fin',       employe.dateFin ? new Date(employe.dateFin).toLocaleDateString('fr-FR') : '—'],
                ['Paiement',  employe.modePaiement],
                ['Compte',    employe.numeroCompte || '—'],
              ].map(([label, val]) => (
                <div key={label} className="d-flex justify-content-between small py-1 border-bottom">
                  <span className="text-muted">{label}</span>
                  <span className="fw-medium text-end">{val}</span>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          {/* Rémunération */}
          <Card className="shadow-sm mb-3">
            <Card.Header><strong>Rémunération</strong></Card.Header>
            <Card.Body>
              <Row className="g-2">
                {[
                  { label: 'Salaire brut',      val: formatMoney(employe.salaireBrut),  color: '#1a56db' },
                  { label: `IPRES (${employe.tauxIPRES}%)`, val: `- ${formatMoney(Math.round(employe.salaireBrut * employe.tauxIPRES / 100))}`, color: '#f59e0b' },
                  { label: `IR (${employe.tauxIR}%)`,       val: `- ${formatMoney(Math.round(employe.salaireBrut * employe.tauxIR / 100))}`,       color: '#ef4444' },
                  { label: 'Salaire net',        val: formatMoney(employe.salaireNet),   color: '#059669' },
                ].map((k) => (
                  <Col key={k.label} xs={6} md={3}>
                    <div className="p-2 rounded border text-center">
                      <div className="text-muted small">{k.label}</div>
                      <div className="fw-bold" style={{ color: k.color }}>{k.val}</div>
                    </div>
                  </Col>
                ))}
              </Row>
              {employe.notes && <p className="text-muted small mt-3 mb-0"><em>{employe.notes}</em></p>}
            </Card.Body>
          </Card>

          {/* Bulletin de paie */}
          <Card className="shadow-sm mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>Bulletin de paie</strong>
              <Button variant="outline-primary" size="sm" onClick={() => setShowBulletin(true)}>
                <FiFileText className="me-1" />Générer
              </Button>
            </Card.Header>
            <Card.Body>
              <Row className="g-2 align-items-end mb-3">
                <Col md={4}>
                  <Form.Select size="sm" value={bulletinPeriode.mois} onChange={(e) => setBulletinPeriode((p) => ({ ...p, mois: Number(e.target.value) }))}>
                    {['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'].map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Control size="sm" type="number" min={2020} max={2035} value={bulletinPeriode.annee}
                    onChange={(e) => setBulletinPeriode((p) => ({ ...p, annee: Number(e.target.value) }))} />
                </Col>
              </Row>

              {showBulletin && loadingBulletin && <Spinner size="sm" animation="border" />}
              {showBulletin && bulletin && (
                <div className="border rounded p-3 bg-light small">
                  <div className="fw-bold mb-2">Bulletin — {String(bulletin.periode.mois).padStart(2,'0')}/{bulletin.periode.annee}</div>
                  <Table size="sm" borderless className="mb-2">
                    <tbody>
                      <tr><td className="text-muted">Salaire brut</td><td className="text-end fw-semibold">{formatMoney(bulletin.salaireBrut)}</td></tr>
                      <tr><td className="text-muted">Cotisations IPRES</td><td className="text-end text-danger">- {formatMoney(bulletin.cotisationsIPRES)}</td></tr>
                      <tr><td className="text-muted">IR retenu</td><td className="text-end text-danger">- {formatMoney(bulletin.irRetenu)}</td></tr>
                      <tr className="border-top"><td className="fw-bold">Net à payer</td><td className="text-end fw-bold text-success">{formatMoney(bulletin.salaireNet)}</td></tr>
                      <tr className="border-top"><td className="text-muted">Charges patronales (IPRES+CSS)</td><td className="text-end">{formatMoney(bulletin.cotisationsPatronales)}</td></tr>
                      <tr><td className="text-muted">Coût total employeur</td><td className="text-end fw-semibold">{formatMoney(bulletin.coutTotalEmployeur)}</td></tr>
                    </tbody>
                  </Table>
                  <Button size="sm" variant="outline-success" onClick={handleGenererEcritures} disabled={generatingEcritures}>
                    {generatingEcritures ? <Spinner size="sm" animation="border" /> : '↓ Générer écritures SYSCOHADA'}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Congés */}
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong>Congés récents</strong>
              <Link to={`/rh/conges/nouveau?employe=${id}`} className="btn btn-outline-secondary btn-sm">
                + Demande congé
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              {conges.length === 0 ? (
                <p className="text-muted text-center small py-3">Aucun congé enregistré.</p>
              ) : (
                <Table size="sm" hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Type</th>
                      <th>Période</th>
                      <th className="text-center">Jours</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conges.map((c) => (
                      <tr key={c._id}>
                        <td className="small">{TYPE_LABELS[c.type] || c.type}</td>
                        <td className="small">{new Date(c.dateDebut).toLocaleDateString('fr-FR')} → {new Date(c.dateFin).toLocaleDateString('fr-FR')}</td>
                        <td className="text-center small fw-semibold">{c.nbJours}</td>
                        <td><Badge bg={STATUT_CONGE[c.statut] || 'secondary'}>{c.statut}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default EmployeDetailPage;
