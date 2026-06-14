import { apiSlice } from './apiSlice';

export const relancesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCreancesEnRetard: builder.query({
      query: () => '/relances/retards',
      providesTags: [{ type: 'Relance', id: 'RETARDS' }],
    }),
    getStatsRelances: builder.query({
      query: () => '/relances/stats',
      providesTags: [{ type: 'Relance', id: 'STATS' }],
    }),
    getRelances: builder.query({
      query: (params) => ({ url: '/relances', params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Relance', id: _id })),
              { type: 'Relance', id: 'LIST' },
            ]
          : [{ type: 'Relance', id: 'LIST' }],
    }),
    getRelance: builder.query({
      query: (id) => `/relances/${id}`,
      providesTags: (result, error, id) => [{ type: 'Relance', id }],
    }),
    createRelance: builder.mutation({
      query: (body) => ({ url: '/relances', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Relance', id: 'LIST' },
        { type: 'Relance', id: 'STATS' },
        { type: 'Relance', id: 'RETARDS' },
      ],
    }),
    acquitterRelance: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/relances/${id}/acquitter`, method: 'POST', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Relance', id },
        { type: 'Relance', id: 'LIST' },
        { type: 'Relance', id: 'STATS' },
      ],
    }),
    annulerRelance: builder.mutation({
      query: (id) => ({ url: `/relances/${id}/annuler`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Relance', id },
        { type: 'Relance', id: 'LIST' },
        { type: 'Relance', id: 'STATS' },
      ],
    }),
    deleteRelance: builder.mutation({
      query: (id) => ({ url: `/relances/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Relance', id: 'LIST' }, { type: 'Relance', id: 'STATS' }],
    }),
  }),
});

export const {
  useGetCreancesEnRetardQuery,
  useGetStatsRelancesQuery,
  useGetRelancesQuery,
  useGetRelanceQuery,
  useCreateRelanceMutation,
  useAcquitterRelanceMutation,
  useAnnulerRelanceMutation,
  useDeleteRelanceMutation,
} = relancesApi;
