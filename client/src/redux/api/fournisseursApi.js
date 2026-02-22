import { apiSlice } from './apiSlice';

export const fournisseursApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFournisseurs: builder.query({
      query: (params) => ({
        url: '/fournisseurs',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Fournisseur', id: _id })), { type: 'Fournisseur', id: 'LIST' }]
          : [{ type: 'Fournisseur', id: 'LIST' }],
    }),
    getFournisseur: builder.query({
      query: (id) => `/fournisseurs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Fournisseur', id }],
    }),
    createFournisseur: builder.mutation({
      query: (body) => ({
        url: '/fournisseurs',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Fournisseur', id: 'LIST' }],
    }),
    updateFournisseur: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/fournisseurs/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Fournisseur', id },
        { type: 'Fournisseur', id: 'LIST' },
      ],
    }),
    deleteFournisseur: builder.mutation({
      query: (id) => ({
        url: `/fournisseurs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Fournisseur', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetFournisseursQuery,
  useGetFournisseurQuery,
  useCreateFournisseurMutation,
  useUpdateFournisseurMutation,
  useDeleteFournisseurMutation,
} = fournisseursApi;
