import React from 'react';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import { formatMoney, formatDate } from '../../utils/formatters';

/**
 * Table générique pour les listes de documents commerciaux.
 *
 * Props:
 *   documents      array                  — liste des documents
 *   statusColors   { statut: variant }    — mapping statut → couleur Bootstrap Badge
 *   statusLabels   { statut: label }      — mapping statut → libellé affiché
 *   tiersLabel     string                 — en-tête colonne tiers (défaut 'Client')
 *   getTiers       fn(doc) => string      — extraction du nom du tiers
 *   getDate        fn(doc) => date|string — extraction de la date principale
 *   extraColumns   [{ key, label, render: fn(doc) => node }]
 *   renderActions  fn(doc) => node        — boutons d'action par ligne
 */
const DocumentsTable = ({
  documents = [],
  statusColors = {},
  statusLabels = {},
  tiersLabel = 'Client',
  getTiers = (doc) =>
    doc.client?.nom ||
    doc.fournisseurSnapshot?.raisonSociale ||
    doc.fournisseur?.raisonSociale ||
    'N/A',
  getDate = (doc) => doc.date || doc.dateCommande,
  extraColumns = [],
  renderActions,
}) => (
  <Table responsive hover className="mb-0">
    <thead className="table-light">
      <tr>
        <th>Numero</th>
        <th>{tiersLabel}</th>
        <th>Date</th>
        {extraColumns.map((col) => (
          <th key={col.key}>{col.label}</th>
        ))}
        <th className="text-end">Montant TTC</th>
        <th>Statut</th>
        {renderActions && <th className="text-end">Actions</th>}
      </tr>
    </thead>
    <tbody>
      {documents.map((doc) => (
        <tr key={doc._id}>
          <td>
            <strong>{doc.numero}</strong>
          </td>
          <td>{getTiers(doc)}</td>
          <td>{formatDate(getDate(doc))}</td>
          {extraColumns.map((col) => (
            <td key={col.key}>{col.render(doc)}</td>
          ))}
          <td className="text-end">
            <strong>{formatMoney(doc.totalTTC)}</strong>
          </td>
          <td>
            <Badge bg={statusColors[doc.statut || doc.status] || 'secondary'}>
              {statusLabels[doc.statut || doc.status] || doc.statut || doc.status}
            </Badge>
          </td>
          {renderActions && (
            <td className="text-end">{renderActions(doc)}</td>
          )}
        </tr>
      ))}
    </tbody>
  </Table>
);

export default DocumentsTable;
