import { apiSlice } from './apiSlice';

export const devisApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDevis: builder.query({
      query: (params) => ({
        url: '/devis',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Devis', id: _id })), { type: 'Devis', id: 'LIST' }]
          : [{ type: 'Devis', id: 'LIST' }],
    }),
    getDevisById: builder.query({
      query: (id) => `/devis/${id}`,
      providesTags: (result, error, id) => [{ type: 'Devis', id }],
    }),
    createDevis: builder.mutation({
      query: (body) => ({
        url: '/devis',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Devis', id: 'LIST' }],
    }),
    updateDevis: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/devis/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Devis', id },
        { type: 'Devis', id: 'LIST' },
      ],
    }),
    deleteDevis: builder.mutation({
      query: (id) => ({
        url: `/devis/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Devis', id: 'LIST' }],
    }),
    convertDevis: builder.mutation({
      query: (id) => ({
        url: `/devis/${id}/convert`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Devis', id },
        { type: 'Devis', id: 'LIST' },
        { type: 'Commande', id: 'LIST' },
      ],
    }),
    sendDevis: builder.mutation({
      query: (id) => ({
        url: `/devis/${id}/send`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Devis', id }],
    }),
    getDevisPDF: builder.query({
      query: (id) => `/devis/${id}/pdf`,
      providesTags: (result, error, id) => [{ type: 'Devis', id }],
    }),
  }),
});

export const {
  useGetDevisQuery,
  useGetDevisByIdQuery,
  useCreateDevisMutation,
  useUpdateDevisMutation,
  useDeleteDevisMutation,
  useConvertDevisMutation,
  useSendDevisMutation,
  useGetDevisPDFQuery,
} = devisApi;
