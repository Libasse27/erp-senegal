import { apiSlice } from './apiSlice';

export const rapportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRapportBilan: builder.query({
      query: (params) => ({ url: '/rapports/bilan', params }),
      providesTags: [{ type: 'Ecriture', id: 'RAPPORT_BILAN' }],
    }),
    getRapportResultat: builder.query({
      query: (params) => ({ url: '/rapports/resultat', params }),
      providesTags: [{ type: 'Ecriture', id: 'RAPPORT_RESULTAT' }],
    }),
    getRapportCA: builder.query({
      query: (params) => ({ url: '/rapports/ca', params }),
      providesTags: [{ type: 'Facture', id: 'RAPPORT_CA' }],
    }),
    getRapportTopClients: builder.query({
      query: (params) => ({ url: '/rapports/top-clients', params }),
      providesTags: [{ type: 'Facture', id: 'RAPPORT_TOP_CLIENTS' }],
    }),
    getRapportTopProduits: builder.query({
      query: (params) => ({ url: '/rapports/top-produits', params }),
      providesTags: [{ type: 'Facture', id: 'RAPPORT_TOP_PRODUITS' }],
    }),
    getRapportRecouvrement: builder.query({
      query: (params) => ({ url: '/rapports/recouvrement', params }),
      providesTags: [{ type: 'Facture', id: 'RAPPORT_RECOUVREMENT' }],
    }),
    getRapportAchats: builder.query({
      query: (params) => ({ url: '/rapports/achats', params }),
      providesTags: [{ type: 'Facture', id: 'RAPPORT_ACHATS' }],
    }),
    getRapportStocksAnalyse: builder.query({
      query: (params) => ({ url: '/rapports/stocks-analyse', params }),
      providesTags: [{ type: 'Stock', id: 'RAPPORT_STOCKS' }],
    }),
    getRapportABC: builder.query({
      query: (params) => ({ url: '/rapports/abc', params }),
      providesTags: [{ type: 'Facture', id: 'RAPPORT_ABC' }],
    }),
    getRapportPerformance: builder.query({
      query: (params) => ({ url: '/rapports/performance', params }),
      providesTags: [{ type: 'Facture', id: 'RAPPORT_PERFORMANCE' }],
    }),
    getRapportActivite: builder.query({
      query: (params) => ({ url: '/rapports/activite', params }),
      providesTags: [{ type: 'Dashboard', id: 'RAPPORT_ACTIVITE' }],
    }),
    getRapportFinancier: builder.query({
      query: (params) => ({ url: '/rapports/financier', params }),
      providesTags: [{ type: 'Paiement', id: 'RAPPORT_FINANCIER' }, { type: 'BankAccount', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetRapportBilanQuery,
  useGetRapportResultatQuery,
  useGetRapportCAQuery,
  useGetRapportTopClientsQuery,
  useGetRapportTopProduitsQuery,
  useGetRapportRecouvrementQuery,
  useGetRapportAchatsQuery,
  useGetRapportStocksAnalyseQuery,
  useGetRapportABCQuery,
  useGetRapportPerformanceQuery,
  useGetRapportActiviteQuery,
  useGetRapportFinancierQuery,
} = rapportsApi;
