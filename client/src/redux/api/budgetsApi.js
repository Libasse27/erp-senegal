import { apiSlice } from './apiSlice';

export const budgetsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBudgets: builder.query({
      query: (params) => ({ url: '/budgets', params }),
      providesTags: [{ type: 'Budget', id: 'LIST' }],
    }),
    getBudget: builder.query({
      query: (id) => `/budgets/${id}`,
      providesTags: (result, error, id) => [{ type: 'Budget', id }],
    }),
    getBudgetComparaison: builder.query({
      query: (params) => ({ url: '/budgets/comparaison', params }),
      providesTags: [{ type: 'Budget', id: 'COMPARAISON' }],
    }),
    createBudget: builder.mutation({
      query: (body) => ({ url: '/budgets', method: 'POST', body }),
      invalidatesTags: [{ type: 'Budget', id: 'LIST' }, { type: 'Budget', id: 'COMPARAISON' }],
    }),
    updateBudget: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/budgets/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Budget', id },
        { type: 'Budget', id: 'LIST' },
        { type: 'Budget', id: 'COMPARAISON' },
      ],
    }),
    deleteBudget: builder.mutation({
      query: (id) => ({ url: `/budgets/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Budget', id: 'LIST' }, { type: 'Budget', id: 'COMPARAISON' }],
    }),
  }),
});

export const {
  useGetBudgetsQuery,
  useGetBudgetQuery,
  useGetBudgetComparaisonQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
} = budgetsApi;
