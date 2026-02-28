import { apiSlice } from './apiSlice';

export const bonsLivraisonApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBonsLivraison: builder.query({
      query: (params) => ({
        url: '/bons-livraison',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'BonLivraison', id: _id })), { type: 'BonLivraison', id: 'LIST' }]
          : [{ type: 'BonLivraison', id: 'LIST' }],
    }),
    getBonLivraison: builder.query({
      query: (id) => `/bons-livraison/${id}`,
      providesTags: (result, error, id) => [{ type: 'BonLivraison', id }],
    }),
    validateBonLivraison: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/bons-livraison/${id}/validate`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'BonLivraison', id },
        { type: 'BonLivraison', id: 'LIST' },
        { type: 'Commande', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetBonsLivraisonQuery,
  useGetBonLivraisonQuery,
  useValidateBonLivraisonMutation,
} = bonsLivraisonApi;
