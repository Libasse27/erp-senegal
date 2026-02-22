import { apiSlice } from './apiSlice';

export const paymentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query({
      query: (params) => ({
        url: '/payments',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Paiement', id: _id })), { type: 'Paiement', id: 'LIST' }]
          : [{ type: 'Paiement', id: 'LIST' }],
    }),
    getPayment: builder.query({
      query: (id) => `/payments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Paiement', id }],
    }),
    createPayment: builder.mutation({
      query: (body) => ({
        url: '/payments',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Paiement', id: 'LIST' }],
    }),
    updatePayment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/payments/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Paiement', id },
        { type: 'Paiement', id: 'LIST' },
      ],
    }),
    deletePayment: builder.mutation({
      query: (id) => ({
        url: `/payments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Paiement', id: 'LIST' }],
    }),
    validatePayment: builder.mutation({
      query: (id) => ({
        url: `/payments/${id}/validate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Paiement', id },
        { type: 'Paiement', id: 'LIST' },
        { type: 'Facture', id: 'LIST' },
        { type: 'Ecriture', id: 'LIST' },
      ],
    }),
    cancelPayment: builder.mutation({
      query: (id) => ({
        url: `/payments/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Paiement', id },
        { type: 'Paiement', id: 'LIST' },
      ],
    }),
    getPaymentSchedule: builder.query({
      query: (params) => ({
        url: '/payments/schedule',
        params,
      }),
      providesTags: [{ type: 'Paiement', id: 'SCHEDULE' }],
    }),
    getTresorerie: builder.query({
      query: (params) => ({
        url: '/payments/tresorerie',
        params,
      }),
      providesTags: [
        { type: 'Paiement', id: 'TRESORERIE' },
        { type: 'BankAccount', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
  useValidatePaymentMutation,
  useCancelPaymentMutation,
  useGetPaymentScheduleQuery,
  useGetTresorerieQuery,
} = paymentsApi;
