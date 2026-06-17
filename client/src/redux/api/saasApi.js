import { apiSlice } from './apiSlice';

export const saasApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Forfaits (public) ────────────────────────────────────────────────────
    getForfaits: builder.query({
      query: () => '/plans',
      providesTags: ['Forfait'],
      transformResponse: (res) => res.data || [],
    }),

    // ── Usage & abonnement actif ─────────────────────────────────────────────
    getUsageSaas: builder.query({
      query: () => '/paiements-saas/usage',
      providesTags: ['Abonnement'],
      transformResponse: (res) => res.data,
    }),

    // ── Paiements SaaS ───────────────────────────────────────────────────────
    getPaiementsSaas: builder.query({
      query: (params = {}) => ({ url: '/paiements-saas', params }),
      providesTags: ['PaiementSaaS'],
      transformResponse: (res) => res,
    }),

    initierPaiementSaas: builder.mutation({
      query: (body) => ({ url: '/paiements-saas/initier', method: 'POST', body }),
      invalidatesTags: ['PaiementSaaS'],
    }),

    getStatutPaiementSaas: builder.query({
      query: (ref) => `/paiements-saas/statut/${ref}`,
      transformResponse: (res) => res.data,
    }),

    confirmerSimulationSaas: builder.mutation({
      query: (body) => ({ url: '/paiements-saas/confirmer-simulation', method: 'POST', body }),
      invalidatesTags: ['PaiementSaaS', 'Abonnement'],
    }),

    // ── Factures d'abonnement (vue entreprise) ───────────────────────────────
    getMesFacturesSaas: builder.query({
      query: (params = {}) => ({ url: '/invoices-saas', params }),
      providesTags: ['InvoiceSaaS'],
      transformResponse: (res) => res,
    }),

    getUneFactureSaas: builder.query({
      query: (id) => `/invoices-saas/${id}`,
      providesTags: (result, error, id) => [{ type: 'InvoiceSaaS', id }],
      transformResponse: (res) => res.data,
    }),
  }),
});

export const {
  useGetForfaitsQuery,
  useGetUsageSaasQuery,
  useGetPaiementsSaasQuery,
  useInitierPaiementSaasMutation,
  useGetStatutPaiementSaasQuery,
  useConfirmerSimulationSaasMutation,
  useGetMesFacturesSaasQuery,
  useGetUneFactureSaasQuery,
} = saasApi;
