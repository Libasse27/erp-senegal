import { apiSlice } from './apiSlice';

export const inventairesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInventaires: builder.query({
      query: (params) => ({ url: '/inventaires', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Inventaire', id: _id })),
              { type: 'Inventaire', id: 'LIST' },
            ]
          : [{ type: 'Inventaire', id: 'LIST' }],
    }),
    getInventaire: builder.query({
      query: (id) => `/inventaires/${id}`,
      providesTags: (result, error, id) => [{ type: 'Inventaire', id }],
    }),
    createInventaire: builder.mutation({
      query: (body) => ({ url: '/inventaires', method: 'POST', body }),
      invalidatesTags: [{ type: 'Inventaire', id: 'LIST' }],
    }),
    updateInventaireLignes: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/inventaires/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Inventaire', id }],
    }),
    demarrerInventaire: builder.mutation({
      query: (id) => ({ url: `/inventaires/${id}/demarrer`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Inventaire', id },
        { type: 'Inventaire', id: 'LIST' },
      ],
    }),
    validerInventaire: builder.mutation({
      query: (id) => ({ url: `/inventaires/${id}/valider`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Inventaire', id },
        { type: 'Inventaire', id: 'LIST' },
        { type: 'Stock', id: 'LIST' },
      ],
    }),
    annulerInventaire: builder.mutation({
      query: (id) => ({ url: `/inventaires/${id}/annuler`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Inventaire', id },
        { type: 'Inventaire', id: 'LIST' },
      ],
    }),
    deleteInventaire: builder.mutation({
      query: (id) => ({ url: `/inventaires/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Inventaire', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetInventairesQuery,
  useGetInventaireQuery,
  useCreateInventaireMutation,
  useUpdateInventaireLignesMutation,
  useDemarrerInventaireMutation,
  useValiderInventaireMutation,
  useAnnulerInventaireMutation,
  useDeleteInventaireMutation,
} = inventairesApi;
