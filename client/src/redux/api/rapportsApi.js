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
  }),
});

export const {
  useGetRapportBilanQuery,
  useGetRapportResultatQuery,
  useGetRapportCAQuery,
} = rapportsApi;
