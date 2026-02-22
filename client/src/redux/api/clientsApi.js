import { apiSlice } from './apiSlice';

export const clientsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getClients: builder.query({
      query: (params) => ({
        url: '/clients',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Client', id: _id })), { type: 'Client', id: 'LIST' }]
          : [{ type: 'Client', id: 'LIST' }],
    }),
    getClient: builder.query({
      query: (id) => `/clients/${id}`,
      providesTags: (result, error, id) => [{ type: 'Client', id }],
    }),
    createClient: builder.mutation({
      query: (body) => ({
        url: '/clients',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Client', id: 'LIST' }],
    }),
    updateClient: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/clients/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Client', id },
        { type: 'Client', id: 'LIST' },
      ],
    }),
    deleteClient: builder.mutation({
      query: (id) => ({
        url: `/clients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Client', id: 'LIST' }],
    }),
    getClientStats: builder.query({
      query: (id) => `/clients/${id}/stats`,
      providesTags: (result, error, id) => [
        { type: 'Client', id },
        { type: 'Facture', id: 'LIST' },
      ],
    }),
    getClientFactures: builder.query({
      query: ({ id, ...params }) => ({
        url: `/clients/${id}/factures`,
        params,
      }),
      providesTags: (result, error, { id }) => [
        { type: 'Client', id },
        { type: 'Facture', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useGetClientStatsQuery,
  useGetClientFacturesQuery,
} = clientsApi;
