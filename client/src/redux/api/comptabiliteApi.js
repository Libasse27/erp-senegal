import { apiSlice } from './apiSlice';

export const comptabiliteApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Plan Comptable
    getPlanComptable: builder.query({
      query: (params) => ({
        url: '/comptabilite/plan',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'CompteComptable', id: _id })), { type: 'CompteComptable', id: 'LIST' }]
          : [{ type: 'CompteComptable', id: 'LIST' }],
    }),
    getCompteComptable: builder.query({
      query: (id) => `/comptabilite/plan/${id}`,
      providesTags: (result, error, id) => [{ type: 'CompteComptable', id }],
    }),
    createCompteComptable: builder.mutation({
      query: (body) => ({
        url: '/comptabilite/plan',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'CompteComptable', id: 'LIST' }],
    }),
    updateCompteComptable: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/comptabilite/plan/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CompteComptable', id },
        { type: 'CompteComptable', id: 'LIST' },
      ],
    }),
    deleteCompteComptable: builder.mutation({
      query: (id) => ({
        url: `/comptabilite/plan/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'CompteComptable', id: 'LIST' }],
    }),

    // Ecritures
    getEcritures: builder.query({
      query: (params) => ({
        url: '/comptabilite/ecritures',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Ecriture', id: _id })), { type: 'Ecriture', id: 'LIST' }]
          : [{ type: 'Ecriture', id: 'LIST' }],
    }),
    getEcriture: builder.query({
      query: (id) => `/comptabilite/ecritures/${id}`,
      providesTags: (result, error, id) => [{ type: 'Ecriture', id }],
    }),
    createEcriture: builder.mutation({
      query: (body) => ({
        url: '/comptabilite/ecritures',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Ecriture', id: 'LIST' }],
    }),
    updateEcriture: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/comptabilite/ecritures/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Ecriture', id },
        { type: 'Ecriture', id: 'LIST' },
      ],
    }),
    validateEcriture: builder.mutation({
      query: (id) => ({
        url: `/comptabilite/ecritures/${id}/validate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Ecriture', id },
        { type: 'Ecriture', id: 'LIST' },
      ],
    }),
    deleteEcriture: builder.mutation({
      query: (id) => ({
        url: `/comptabilite/ecritures/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Ecriture', id: 'LIST' }],
    }),
    contrepasserEcriture: builder.mutation({
      query: (id) => ({
        url: `/comptabilite/ecritures/${id}/contrepasser`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Ecriture', id: 'LIST' }],
    }),

    // Lettrage
    lettrerEcritures: builder.mutation({
      query: (body) => ({
        url: '/comptabilite/lettrage',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Ecriture', id: 'LIST' }],
    }),

    // Exercices
    getExercices: builder.query({
      query: (params) => ({
        url: '/comptabilite/exercices',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Exercice', id: _id })), { type: 'Exercice', id: 'LIST' }]
          : [{ type: 'Exercice', id: 'LIST' }],
    }),
    createExercice: builder.mutation({
      query: (body) => ({
        url: '/comptabilite/exercices',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Exercice', id: 'LIST' }],
    }),
    cloturerExercice: builder.mutation({
      query: (id) => ({
        url: `/comptabilite/exercices/${id}/cloture`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Exercice', id },
        { type: 'Exercice', id: 'LIST' },
      ],
    }),

    // Etats financiers
    getGrandLivre: builder.query({
      query: (params) => ({
        url: '/comptabilite/grand-livre',
        params,
      }),
      providesTags: [{ type: 'Ecriture', id: 'GRAND_LIVRE' }],
    }),
    getBalance: builder.query({
      query: (params) => ({
        url: '/comptabilite/balance',
        params,
      }),
      providesTags: [{ type: 'Ecriture', id: 'BALANCE' }],
    }),
    getCompteResultat: builder.query({
      query: (params) => ({
        url: '/comptabilite/compte-resultat',
        params,
      }),
      providesTags: [{ type: 'Ecriture', id: 'COMPTE_RESULTAT' }],
    }),
    getBilan: builder.query({
      query: (params) => ({
        url: '/comptabilite/bilan',
        params,
      }),
      providesTags: [{ type: 'Ecriture', id: 'BILAN' }],
    }),
    getDeclarationTVA: builder.query({
      query: (params) => ({
        url: '/comptabilite/tva',
        params,
      }),
      providesTags: [{ type: 'Ecriture', id: 'TVA' }],
    }),
    exportFEC: builder.query({
      query: (params) => ({
        url: '/comptabilite/fec',
        params,
      }),
      providesTags: [{ type: 'Ecriture', id: 'FEC' }],
    }),
  }),
});

export const {
  useGetPlanComptableQuery,
  useGetCompteComptableQuery,
  useCreateCompteComptableMutation,
  useUpdateCompteComptableMutation,
  useDeleteCompteComptableMutation,
  useGetEcrituresQuery,
  useGetEcritureQuery,
  useCreateEcritureMutation,
  useUpdateEcritureMutation,
  useValidateEcritureMutation,
  useDeleteEcritureMutation,
  useContrepasserEcritureMutation,
  useLettrerEcrituresMutation,
  useGetExercicesQuery,
  useCreateExerciceMutation,
  useCloturerExerciceMutation,
  useGetGrandLivreQuery,
  useGetBalanceQuery,
  useGetCompteResultatQuery,
  useGetBilanQuery,
  useGetDeclarationTVAQuery,
  useExportFECQuery,
} = comptabiliteApi;
