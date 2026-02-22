import { apiSlice } from './apiSlice';

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query({
      query: (params) => ({
        url: '/dashboard/summary',
        params,
      }),
      providesTags: [
        { type: 'Dashboard', id: 'SUMMARY' },
        { type: 'Client', id: 'LIST' },
        { type: 'Facture', id: 'LIST' },
        { type: 'Paiement', id: 'LIST' },
        { type: 'Stock', id: 'LIST' },
      ],
    }),
    getDashboardStats: builder.query({
      query: (params) => ({
        url: '/dashboard/stats',
        params,
      }),
      providesTags: [{ type: 'Dashboard', id: 'STATS' }],
    }),
    getDashboardCharts: builder.query({
      query: (params) => ({
        url: '/dashboard/charts',
        params,
      }),
      providesTags: [{ type: 'Dashboard', id: 'CHARTS' }],
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetDashboardStatsQuery,
  useGetDashboardChartsQuery,
} = dashboardApi;
