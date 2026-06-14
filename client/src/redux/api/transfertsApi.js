import { apiSlice } from './apiSlice';

export const transfertsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTransferts: builder.query({
      query: (params) => ({ url: '/transferts', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Transfert', id: _id })),
              { type: 'Transfert', id: 'LIST' },
            ]
          : [{ type: 'Transfert', id: 'LIST' }],
    }),
    getTransfert: builder.query({
      query: (id) => `/transferts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Transfert', id }],
    }),
    createTransfert: builder.mutation({
      query: (body) => ({ url: '/transferts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Transfert', id: 'LIST' }],
    }),
    updateTransfert: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/transferts/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Transfert', id },
        { type: 'Transfert', id: 'LIST' },
      ],
    }),
    deleteTransfert: builder.mutation({
      query: (id) => ({ url: `/transferts/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Transfert', id: 'LIST' }],
    }),
    validerTransfert: builder.mutation({
      query: (id) => ({ url: `/transferts/${id}/valider`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Transfert', id },
        { type: 'Transfert', id: 'LIST' },
        { type: 'Stock', id: 'LIST' },
        { type: 'StockMovement', id: 'LIST' },
      ],
    }),
    annulerTransfert: builder.mutation({
      query: (id) => ({ url: `/transferts/${id}/annuler`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Transfert', id },
        { type: 'Transfert', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetTransfertsQuery,
  useGetTransfertQuery,
  useCreateTransfertMutation,
  useUpdateTransfertMutation,
  useDeleteTransfertMutation,
  useValiderTransfertMutation,
  useAnnulerTransfertMutation,
} = transfertsApi;
