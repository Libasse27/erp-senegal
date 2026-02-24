import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // Don't try to refresh if the failing request was itself the refresh endpoint
    const url = typeof args === 'string' ? args : args.url;
    if (url === '/auth/refresh-token') {
      api.dispatch({ type: 'auth/logout' });
      return result;
    }

    const refreshResult = await baseQuery(
      { url: '/auth/refresh-token', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult?.data) {
      api.dispatch({
        type: 'auth/setAccessToken',
        payload: refreshResult.data.data.accessToken,
      });
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch({ type: 'auth/logout' });
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  keepUnusedDataFor: 300, // 5 minutes cache for unused data
  tagTypes: [
    'Client',
    'Fournisseur',
    'Produit',
    'Category',
    'Facture',
    'Devis',
    'Commande',
    'BonLivraison',
    'Stock',
    'StockMovement',
    'Warehouse',
    'Paiement',
    'BankAccount',
    'Ecriture',
    'CompteComptable',
    'Exercice',
    'PurchaseOrder',
    'PurchaseInvoice',
    'Dashboard',
    'User',
    'Role',
    'AuditLog',
    'Settings',
    'Company',
    'Notification',
  ],
  endpoints: () => ({}),
});
