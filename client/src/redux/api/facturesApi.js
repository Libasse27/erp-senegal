import { apiSlice } from './apiSlice';

export const facturesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFactures: builder.query({
      query: (params) => ({
        url: '/factures',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Facture', id: _id })), { type: 'Facture', id: 'LIST' }]
          : [{ type: 'Facture', id: 'LIST' }],
    }),
    getFacture: builder.query({
      query: (id) => `/factures/${id}`,
      providesTags: (result, error, id) => [{ type: 'Facture', id }],
    }),
    createFacture: builder.mutation({
      query: (body) => ({
        url: '/factures',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Facture', id: 'LIST' }],
    }),
    updateFacture: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/factures/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Facture', id },
        { type: 'Facture', id: 'LIST' },
      ],
    }),
    deleteFacture: builder.mutation({
      query: (id) => ({
        url: `/factures/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Facture', id: 'LIST' }],
    }),
    validateFacture: builder.mutation({
      query: (id) => ({
        url: `/factures/${id}/validate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Facture', id },
        { type: 'Facture', id: 'LIST' },
        { type: 'Ecriture', id: 'LIST' },
      ],
    }),
    sendFacture: builder.mutation({
      query: (id) => ({
        url: `/factures/${id}/send`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Facture', id }],
    }),
    createAvoir: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/factures/${id}/avoir`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Facture', id },
        { type: 'Facture', id: 'LIST' },
      ],
    }),
    getFacturePDF: builder.query({
      query: (id) => `/factures/${id}/pdf`,
      providesTags: (result, error, id) => [{ type: 'Facture', id }],
    }),
  }),
});

export const {
  useGetFacturesQuery,
  useGetFactureQuery,
  useCreateFactureMutation,
  useUpdateFactureMutation,
  useDeleteFactureMutation,
  useValidateFactureMutation,
  useSendFactureMutation,
  useCreateAvoirMutation,
  useGetFacturePDFQuery,
} = facturesApi;
