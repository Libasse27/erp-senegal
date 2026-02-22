import { apiSlice } from './apiSlice';

export const commandesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCommandes: builder.query({
      query: (params) => ({
        url: '/commandes',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Commande', id: _id })), { type: 'Commande', id: 'LIST' }]
          : [{ type: 'Commande', id: 'LIST' }],
    }),
    getCommande: builder.query({
      query: (id) => `/commandes/${id}`,
      providesTags: (result, error, id) => [{ type: 'Commande', id }],
    }),
    createCommande: builder.mutation({
      query: (body) => ({
        url: '/commandes',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Commande', id: 'LIST' }],
    }),
    updateCommande: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/commandes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Commande', id },
        { type: 'Commande', id: 'LIST' },
      ],
    }),
    updateCommandeStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/commandes/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Commande', id },
        { type: 'Commande', id: 'LIST' },
      ],
    }),
    generateLivraison: builder.mutation({
      query: (id) => ({
        url: `/commandes/${id}/livraison`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Commande', id },
        { type: 'Commande', id: 'LIST' },
        { type: 'BonLivraison', id: 'LIST' },
      ],
    }),
    deleteCommande: builder.mutation({
      query: (id) => ({
        url: `/commandes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Commande', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetCommandesQuery,
  useGetCommandeQuery,
  useCreateCommandeMutation,
  useUpdateCommandeMutation,
  useUpdateCommandeStatusMutation,
  useGenerateLivraisonMutation,
  useDeleteCommandeMutation,
} = commandesApi;
