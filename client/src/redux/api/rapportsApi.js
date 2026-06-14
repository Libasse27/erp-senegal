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
  }),
});

export const {
  useGetRapportBilanQuery,
  useGetRapportResultatQuery,
  useGetRapportCAQuery,
  useGetRapportTopClientsQuery,
  useGetRapportTopProduitsQuery,
  useGetRapportRecouvrementQuery,
} = rapportsApi;
