import { apiSlice } from './apiSlice';

export const commandesAchatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCommandesAchat: builder.query({
      query: (params) => ({ url: '/commandes-achat', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'CommandeAchat', id: _id })),
              { type: 'CommandeAchat', id: 'LIST' },
            ]
          : [{ type: 'CommandeAchat', id: 'LIST' }],
    }),
    getCommandeAchat: builder.query({
      query: (id) => `/commandes-achat/${id}`,
      providesTags: (result, error, id) => [{ type: 'CommandeAchat', id }],
    }),
    createCommandeAchat: builder.mutation({
      query: (body) => ({ url: '/commandes-achat', method: 'POST', body }),
      invalidatesTags: [{ type: 'CommandeAchat', id: 'LIST' }],
    }),
    updateCommandeAchat: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/commandes-achat/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CommandeAchat', id },
        { type: 'CommandeAchat', id: 'LIST' },
      ],
    }),
    deleteCommandeAchat: builder.mutation({
      query: (id) => ({ url: `/commandes-achat/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'CommandeAchat', id: 'LIST' }],
    }),
    updateCommandeAchatStatut: builder.mutation({
      query: ({ id, statut }) => ({
        url: `/commandes-achat/${id}/statut`,
        method: 'PUT',
        body: { statut },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CommandeAchat', id },
        { type: 'CommandeAchat', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetCommandesAchatQuery,
  useGetCommandeAchatQuery,
  useCreateCommandeAchatMutation,
  useUpdateCommandeAchatMutation,
  useDeleteCommandeAchatMutation,
  useUpdateCommandeAchatStatutMutation,
} = commandesAchatApi;
