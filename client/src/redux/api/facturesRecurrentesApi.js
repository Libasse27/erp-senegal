import { apiSlice } from './apiSlice';

const facturesRecurrentesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFacturesRecurrentes: builder.query({
      query: (params = {}) => ({ url: '/factures-recurrentes', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'FactureRecurrente', id: _id })),
              { type: 'FactureRecurrente', id: 'LIST' },
            ]
          : [{ type: 'FactureRecurrente', id: 'LIST' }],
    }),

    getFactureRecurrente: builder.query({
      query: (id) => `/factures-recurrentes/${id}`,
      providesTags: (result, error, id) => [{ type: 'FactureRecurrente', id }],
    }),

    createFactureRecurrente: builder.mutation({
      query: (body) => ({ url: '/factures-recurrentes', method: 'POST', body }),
      invalidatesTags: [{ type: 'FactureRecurrente', id: 'LIST' }],
    }),

    updateFactureRecurrente: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/factures-recurrentes/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'FactureRecurrente', id },
        { type: 'FactureRecurrente', id: 'LIST' },
      ],
    }),

    deleteFactureRecurrente: builder.mutation({
      query: (id) => ({ url: `/factures-recurrentes/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'FactureRecurrente', id: 'LIST' }],
    }),

    toggleFactureRecurrenteActive: builder.mutation({
      query: (id) => ({ url: `/factures-recurrentes/${id}/toggle-active`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [
        { type: 'FactureRecurrente', id },
        { type: 'FactureRecurrente', id: 'LIST' },
      ],
    }),

    genererFactureMaintenant: builder.mutation({
      query: (id) => ({ url: `/factures-recurrentes/${id}/generer-maintenant`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [
        { type: 'FactureRecurrente', id },
        { type: 'FactureRecurrente', id: 'LIST' },
        { type: 'Facture', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetFacturesRecurrentesQuery,
  useGetFactureRecurrenteQuery,
  useCreateFactureRecurrenteMutation,
  useUpdateFactureRecurrenteMutation,
  useDeleteFactureRecurrenteMutation,
  useToggleFactureRecurrenteActiveMutation,
  useGenererFactureMaintenantMutation,
} = facturesRecurrentesApi;
