import { apiSlice } from './apiSlice';

export const bankAccountsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBankAccounts: builder.query({
      query: (params) => ({
        url: '/bank-accounts',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'BankAccount', id: _id })), { type: 'BankAccount', id: 'LIST' }]
          : [{ type: 'BankAccount', id: 'LIST' }],
    }),
    getBankAccount: builder.query({
      query: (id) => `/bank-accounts/${id}`,
      providesTags: (result, error, id) => [{ type: 'BankAccount', id }],
    }),
    createBankAccount: builder.mutation({
      query: (body) => ({
        url: '/bank-accounts',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'BankAccount', id: 'LIST' }],
    }),
    updateBankAccount: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/bank-accounts/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'BankAccount', id },
        { type: 'BankAccount', id: 'LIST' },
      ],
    }),
    deleteBankAccount: builder.mutation({
      query: (id) => ({
        url: `/bank-accounts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'BankAccount', id: 'LIST' }],
    }),
    getReconciliation: builder.query({
      query: ({ id, ...params }) => ({
        url: `/bank-accounts/${id}/reconciliation`,
        params,
      }),
      providesTags: (result, error, { id }) => [
        { type: 'BankAccount', id },
        { type: 'Paiement', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetBankAccountsQuery,
  useGetBankAccountQuery,
  useCreateBankAccountMutation,
  useUpdateBankAccountMutation,
  useDeleteBankAccountMutation,
  useGetReconciliationQuery,
} = bankAccountsApi;
