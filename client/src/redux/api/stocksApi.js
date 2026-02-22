import { apiSlice } from './apiSlice';

export const stocksApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStocks: builder.query({
      query: (params) => ({
        url: '/stocks',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Stock', id: _id })), { type: 'Stock', id: 'LIST' }]
          : [{ type: 'Stock', id: 'LIST' }],
    }),
    getStockAlerts: builder.query({
      query: (params) => ({
        url: '/stocks/alerts',
        params,
      }),
      providesTags: [{ type: 'Stock', id: 'ALERTS' }],
    }),
    getStockMovements: builder.query({
      query: (params) => ({
        url: '/stocks/movements',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'StockMovement', id: _id })), { type: 'StockMovement', id: 'LIST' }]
          : [{ type: 'StockMovement', id: 'LIST' }],
    }),
    createStockMovement: builder.mutation({
      query: (body) => ({
        url: '/stocks/movements',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'StockMovement', id: 'LIST' },
        { type: 'Stock', id: 'LIST' },
        { type: 'Stock', id: 'ALERTS' },
      ],
    }),
    getWarehouses: builder.query({
      query: (params) => ({
        url: '/warehouses',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Warehouse', id: _id })), { type: 'Warehouse', id: 'LIST' }]
          : [{ type: 'Warehouse', id: 'LIST' }],
    }),
    createWarehouse: builder.mutation({
      query: (body) => ({
        url: '/warehouses',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Warehouse', id: 'LIST' }],
    }),
    updateWarehouse: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/warehouses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Warehouse', id },
        { type: 'Warehouse', id: 'LIST' },
      ],
    }),
    deleteWarehouse: builder.mutation({
      query: (id) => ({
        url: `/warehouses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Warehouse', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetStocksQuery,
  useGetStockAlertsQuery,
  useGetStockMovementsQuery,
  useCreateStockMovementMutation,
  useGetWarehousesQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
} = stocksApi;
