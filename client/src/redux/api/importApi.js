import { apiSlice } from './apiSlice';

export const importApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    importData: builder.mutation({
      query: ({ type, formData }) => ({
        url: `/imports/${type}`,
        method: 'POST',
        body: formData,
        // RTK Query passe formData directement (pas de Content-Type forcé)
        formData: true,
      }),
      invalidatesTags: (result, error, { type }) => {
        const tagMap = {
          clients:      [{ type: 'Client',      id: 'LIST' }],
          fournisseurs: [{ type: 'Fournisseur', id: 'LIST' }],
          produits:     [{ type: 'Produit',     id: 'LIST' }],
        };
        return tagMap[type] || [];
      },
    }),
  }),
});

export const { useImportDataMutation } = importApi;
