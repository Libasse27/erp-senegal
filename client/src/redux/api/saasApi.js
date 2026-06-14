import { apiSlice } from './apiSlice';

export const saasApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Forfaits (public) ────────────────────────────────────────────────────
    getForfaits: builder.query({
      query: () => '/forfaits',
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
  }),
});

export const {
  useGetForfaitsQuery,
  useGetUsageSaasQuery,
  useGetPaiementsSaasQuery,
  useInitierPaiementSaasMutation,
  useGetStatutPaiementSaasQuery,
  useConfirmerSimulationSaasMutation,
} = saasApi;
