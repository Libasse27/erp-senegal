import { apiSlice } from './apiSlice';

export const facturesFournisseurApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFacturesFournisseur: builder.query({
      query: (params) => ({ url: '/factures-fournisseur', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'FactureFournisseur', id: _id })),
              { type: 'FactureFournisseur', id: 'LIST' },
            ]
          : [{ type: 'FactureFournisseur', id: 'LIST' }],
    }),
    getFactureFournisseur: builder.query({
      query: (id) => `/factures-fournisseur/${id}`,
      providesTags: (result, error, id) => [{ type: 'FactureFournisseur', id }],
    }),
    getStatsFacturesFournisseur: builder.query({
      query: () => '/factures-fournisseur/stats',
      providesTags: [{ type: 'FactureFournisseur', id: 'STATS' }],
    }),
    createFactureFournisseur: builder.mutation({
      query: (body) => ({ url: '/factures-fournisseur', method: 'POST', body }),
      invalidatesTags: [
        { type: 'FactureFournisseur', id: 'LIST' },
        { type: 'FactureFournisseur', id: 'STATS' },
      ],
    }),
    updateFactureFournisseur: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/factures-fournisseur/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'FactureFournisseur', id },
        { type: 'FactureFournisseur', id: 'LIST' },
      ],
    }),
    deleteFactureFournisseur: builder.mutation({
      query: (id) => ({ url: `/factures-fournisseur/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'FactureFournisseur', id: 'LIST' },
        { type: 'FactureFournisseur', id: 'STATS' },
      ],
    }),
    validerFactureFournisseur: builder.mutation({
      query: (id) => ({ url: `/factures-fournisseur/${id}/valider`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [
        { type: 'FactureFournisseur', id },
        { type: 'FactureFournisseur', id: 'LIST' },
        { type: 'FactureFournisseur', id: 'STATS' },
      ],
    }),
    enregistrerPaiementFournisseur: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/factures-fournisseur/${id}/paiement`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'FactureFournisseur', id },
        { type: 'FactureFournisseur', id: 'LIST' },
        { type: 'FactureFournisseur', id: 'STATS' },
        { type: 'Paiement', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetFacturesFournisseurQuery,
  useGetFactureFournisseurQuery,
  useGetStatsFacturesFournisseurQuery,
  useCreateFactureFournisseurMutation,
  useUpdateFactureFournisseurMutation,
  useDeleteFactureFournisseurMutation,
  useValiderFactureFournisseurMutation,
  useEnregistrerPaiementFournisseurMutation,
} = facturesFournisseurApi;
