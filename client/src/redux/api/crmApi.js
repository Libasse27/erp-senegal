import { apiSlice } from './apiSlice';

export const crmApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Opportunités ──────────────────────────────────────────────────
    getOpportunites: builder.query({
      query: (params) => ({ url: '/crm/opportunites', params }),
      providesTags: [{ type: 'Opportunite', id: 'LIST' }],
    }),
    getOpportunite: builder.query({
      query: (id) => `/crm/opportunites/${id}`,
      providesTags: (result, error, id) => [{ type: 'Opportunite', id }],
    }),
    getPipelineStats: builder.query({
      query: () => '/crm/opportunites/pipeline',
      providesTags: [{ type: 'Opportunite', id: 'PIPELINE' }],
    }),
    createOpportunite: builder.mutation({
      query: (body) => ({ url: '/crm/opportunites', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Opportunite', id: 'LIST' },
        { type: 'Opportunite', id: 'PIPELINE' },
      ],
    }),
    updateOpportunite: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/crm/opportunites/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Opportunite', id },
        { type: 'Opportunite', id: 'LIST' },
        { type: 'Opportunite', id: 'PIPELINE' },
      ],
    }),
    deleteOpportunite: builder.mutation({
      query: (id) => ({ url: `/crm/opportunites/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'Opportunite', id: 'LIST' },
        { type: 'Opportunite', id: 'PIPELINE' },
      ],
    }),
    convertirEnDevis: builder.mutation({
      query: (id) => ({ url: `/crm/opportunites/${id}/convertir-devis`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Opportunite', id },
        { type: 'Devis', id: 'LIST' },
      ],
    }),

    // ── Activités ─────────────────────────────────────────────────────
    getActivites: builder.query({
      query: (params) => ({ url: '/crm/activites', params }),
      providesTags: [{ type: 'Activite', id: 'LIST' }],
    }),
    createActivite: builder.mutation({
      query: (body) => ({ url: '/crm/activites', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Activite', id: 'LIST' },
        { type: 'Opportunite', id: 'PIPELINE' },
      ],
    }),
    updateActivite: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/crm/activites/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Activite', id },
        { type: 'Activite', id: 'LIST' },
      ],
    }),
    deleteActivite: builder.mutation({
      query: (id) => ({ url: `/crm/activites/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Activite', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetOpportunitesQuery,
  useGetOpportuniteQuery,
  useGetPipelineStatsQuery,
  useCreateOpportuniteMutation,
  useUpdateOpportuniteMutation,
  useDeleteOpportuniteMutation,
  useConvertirEnDevisMutation,
  useGetActivitesQuery,
  useCreateActiviteMutation,
  useUpdateActiviteMutation,
  useDeleteActiviteMutation,
} = crmApi;
