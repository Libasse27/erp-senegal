import { apiSlice } from './apiSlice';

export const rhApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Employés ──────────────────────────────────────────────────────
    getEmployes: builder.query({
      query: (params) => ({ url: '/rh/employes', params }),
      providesTags: [{ type: 'Employe', id: 'LIST' }],
    }),
    getEmploye: builder.query({
      query: (id) => `/rh/employes/${id}`,
      providesTags: (result, error, id) => [{ type: 'Employe', id }],
    }),
    getStatsRH: builder.query({
      query: () => '/rh/employes/stats',
      providesTags: [{ type: 'Employe', id: 'STATS' }],
    }),
    getBulletin: builder.query({
      query: ({ id, mois, annee }) => ({ url: `/rh/employes/${id}/bulletin`, params: { mois, annee } }),
    }),
    createEmploye: builder.mutation({
      query: (body) => ({ url: '/rh/employes', method: 'POST', body }),
      invalidatesTags: [{ type: 'Employe', id: 'LIST' }, { type: 'Employe', id: 'STATS' }],
    }),
    updateEmploye: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/rh/employes/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employe', id },
        { type: 'Employe', id: 'LIST' },
        { type: 'Employe', id: 'STATS' },
      ],
    }),
    deleteEmploye: builder.mutation({
      query: (id) => ({ url: `/rh/employes/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Employe', id: 'LIST' }, { type: 'Employe', id: 'STATS' }],
    }),
    genererEcrituresPayroll: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/rh/employes/${id}/ecritures-paie`, method: 'POST', body }),
      invalidatesTags: [{ type: 'Ecriture', id: 'LIST' }],
    }),

    // ── Congés ────────────────────────────────────────────────────────
    getConges: builder.query({
      query: (params) => ({ url: '/rh/conges', params }),
      providesTags: [{ type: 'Conge', id: 'LIST' }],
    }),
    getConge: builder.query({
      query: (id) => `/rh/conges/${id}`,
      providesTags: (result, error, id) => [{ type: 'Conge', id }],
    }),
    getCongesStats: builder.query({
      query: () => '/rh/conges/stats',
      providesTags: [{ type: 'Conge', id: 'STATS' }],
    }),
    createConge: builder.mutation({
      query: (body) => ({ url: '/rh/conges', method: 'POST', body }),
      invalidatesTags: [{ type: 'Conge', id: 'LIST' }, { type: 'Conge', id: 'STATS' }],
    }),
    updateConge: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/rh/conges/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Conge', id },
        { type: 'Conge', id: 'LIST' },
        { type: 'Conge', id: 'STATS' },
        { type: 'Employe', id: 'LIST' },
      ],
    }),
    deleteConge: builder.mutation({
      query: (id) => ({ url: `/rh/conges/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Conge', id: 'LIST' }, { type: 'Conge', id: 'STATS' }],
    }),
  }),
});

export const {
  useGetEmployesQuery,
  useGetEmployeQuery,
  useGetStatsRHQuery,
  useGetBulletinQuery,
  useCreateEmployeMutation,
  useUpdateEmployeMutation,
  useDeleteEmployeMutation,
  useGenererEcrituresPayrollMutation,
  useGetCongesQuery,
  useGetCongeQuery,
  useGetCongesStatsQuery,
  useCreateCongeMutation,
  useUpdateCongeMutation,
  useDeleteCongeMutation,
} = rhApi;
