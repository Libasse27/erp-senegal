import { apiSlice } from './apiSlice';

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query({
      query: (params) => ({ url: '/dashboard/summary', params }),
      providesTags: [
        { type: 'Dashboard', id: 'SUMMARY' },
        { type: 'Client', id: 'LIST' },
        { type: 'Facture', id: 'LIST' },
        { type: 'Paiement', id: 'LIST' },
        { type: 'Stock', id: 'LIST' },
      ],
    }),
    getDashboardStats: builder.query({
      query: (params) => ({ url: '/dashboard/stats', params }),
      providesTags: [{ type: 'Dashboard', id: 'STATS' }],
    }),
    getDashboardCharts: builder.query({
      query: (params) => ({ url: '/dashboard/charts', params }),
      providesTags: [{ type: 'Dashboard', id: 'CHARTS' }],
    }),
    getDashboardTopClients: builder.query({
      query: (params) => ({ url: '/dashboard/top-clients', params }),
      providesTags: [{ type: 'Dashboard', id: 'TOP_CLIENTS' }, { type: 'Facture', id: 'LIST' }],
    }),
    getDashboardStockAlerts: builder.query({
      query: (params) => ({ url: '/dashboard/stock-alerts', params }),
      providesTags: [{ type: 'Dashboard', id: 'STOCK_ALERTS' }, { type: 'Stock', id: 'LIST' }],
    }),
    getDashboardKpis: builder.query({
      query: (params) => ({ url: '/dashboard/kpis', params }),
      providesTags: [{ type: 'Dashboard', id: 'KPIS' }],
    }),
    getDashboardTopProducts: builder.query({
      query: (params) => ({ url: '/dashboard/top-products', params }),
      providesTags: [{ type: 'Dashboard', id: 'TOP_PRODUCTS' }, { type: 'Facture', id: 'LIST' }],
    }),
    getDashboardStockEvolution: builder.query({
      query: (params) => ({ url: '/dashboard/stock-evolution', params }),
      providesTags: [{ type: 'Dashboard', id: 'STOCK_EVOLUTION' }, { type: 'Stock', id: 'LIST' }],
    }),
    getDashboardRecouvrement: builder.query({
      query: (params) => ({ url: '/dashboard/recouvrement', params }),
      providesTags: [{ type: 'Dashboard', id: 'RECOUVREMENT' }, { type: 'Facture', id: 'LIST' }, { type: 'Paiement', id: 'LIST' }],
    }),
    getDashboardCashflow: builder.query({
      query: (params) => ({ url: '/dashboard/cashflow', params }),
      providesTags: [{ type: 'Dashboard', id: 'CASHFLOW' }, { type: 'Paiement', id: 'LIST' }],
    }),
    getDashboardFunnel: builder.query({
      query: (params) => ({ url: '/dashboard/funnel', params }),
      providesTags: [{ type: 'Dashboard', id: 'FUNNEL' }],
    }),
    getDashboardPeriode: builder.query({
      query: (params) => ({ url: '/dashboard/periode', params }),
      providesTags: [{ type: 'Dashboard', id: 'PERIODE' }],
    }),
    getDashboardComparaison: builder.query({
      query: (params) => ({ url: '/dashboard/comparaison', params }),
      providesTags: [{ type: 'Dashboard', id: 'COMPARAISON' }],
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetDashboardStatsQuery,
  useGetDashboardChartsQuery,
  useGetDashboardTopClientsQuery,
  useGetDashboardStockAlertsQuery,
  useGetDashboardKpisQuery,
  useGetDashboardTopProductsQuery,
  useGetDashboardStockEvolutionQuery,
  useGetDashboardRecouvrementQuery,
  useGetDashboardCashflowQuery,
  useGetDashboardFunnelQuery,
  useGetDashboardPeriodeQuery,
  useGetDashboardComparaisonQuery,
} = dashboardApi;
