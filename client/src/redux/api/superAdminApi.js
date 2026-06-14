import { apiSlice } from './apiSlice';

export const superAdminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Tableau de bord ──────────────────────────────────────────────────────
    getSystemStats: builder.query({
      query: () => '/super-admin/stats',
      providesTags: ['SystemStats'],
    }),
    getSystemHealth: builder.query({
      query: () => '/super-admin/health',
      providesTags: ['SystemHealth'],
    }),

    // ── Utilisateurs (vue Super Admin) ───────────────────────────────────────
    getAllUsersAdmin: builder.query({
      query: (params) => ({ url: '/super-admin/users', params }),
      providesTags: ['User'],
    }),
    forceLogoutUser: builder.mutation({
      query: (id) => ({ url: `/super-admin/users/${id}/force-logout`, method: 'POST' }),
      invalidatesTags: ['User'],
    }),
    unlockUserAccount: builder.mutation({
      query: (id) => ({ url: `/super-admin/users/${id}/unlock`, method: 'POST' }),
      invalidatesTags: ['User'],
    }),
    resetUserPassword: builder.mutation({
      query: ({ id, newPassword }) => ({
        url: `/super-admin/users/${id}/reset-password`,
        method: 'POST',
        body: { newPassword },
      }),
    }),
    changeUserRole: builder.mutation({
      query: ({ id, roleId }) => ({
        url: `/super-admin/users/${id}/role`,
        method: 'PUT',
        body: { roleId },
      }),
      invalidatesTags: ['User'],
    }),

    // ── RBAC ─────────────────────────────────────────────────────────────────
    getRbacMatrix: builder.query({
      query: () => '/super-admin/rbac-matrix',
      providesTags: ['RbacMatrix', 'Role', 'Permission'],
    }),

    // ── Journaux d'audit ─────────────────────────────────────────────────────
    getSuperAdminAuditLogs: builder.query({
      query: (params) => ({ url: '/super-admin/audit-logs', params }),
      providesTags: ['AuditLog'],
    }),
    purgeAuditLogs: builder.mutation({
      query: (body) => ({ url: '/super-admin/audit-logs/purge', method: 'DELETE', body }),
      invalidatesTags: ['AuditLog'],
    }),

    // ── Journaux systeme ─────────────────────────────────────────────────────
    getSystemLogs: builder.query({
      query: (params) => ({ url: '/super-admin/system-logs', params }),
      providesTags: ['SystemLog'],
    }),
    getLogFiles: builder.query({
      query: () => '/super-admin/system-logs/files',
      providesTags: ['SystemLog'],
    }),

    // ── Sauvegardes ──────────────────────────────────────────────────────────
    listBackups: builder.query({
      query: () => '/super-admin/backups',
      providesTags: ['Backup'],
    }),
    createBackup: builder.mutation({
      query: () => ({ url: '/super-admin/backups', method: 'POST' }),
      invalidatesTags: ['Backup'],
    }),
    deleteBackup: builder.mutation({
      query: (filename) => ({ url: `/super-admin/backups/${encodeURIComponent(filename)}`, method: 'DELETE' }),
      invalidatesTags: ['Backup'],
    }),

    // ── Gestion des entreprises ───────────────────────────────────────────────
    getCompaniesOverview: builder.query({
      query: () => '/super-admin/companies/overview',
      providesTags: ['Company'],
    }),
    listAllCompanies: builder.query({
      query: (params) => ({ url: '/super-admin/companies', params }),
      providesTags: ['Company'],
    }),
    getCompanyAdmin: builder.query({
      query: (id) => `/super-admin/companies/${id}`,
      providesTags: (result, error, id) => [{ type: 'Company', id }],
    }),
    createCompanyAdmin: builder.mutation({
      query: (body) => ({ url: '/super-admin/companies', method: 'POST', body }),
      invalidatesTags: ['Company'],
    }),
    updateCompanyAdmin: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/super-admin/companies/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Company'],
    }),
    suspendCompany: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/super-admin/companies/${id}/suspend`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Company'],
    }),
    activateCompany: builder.mutation({
      query: (id) => ({ url: `/super-admin/companies/${id}/activate`, method: 'POST' }),
      invalidatesTags: ['Company'],
    }),
    deleteCompanyAdmin: builder.mutation({
      query: (id) => ({ url: `/super-admin/companies/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Company'],
    }),
  }),
});

export const {
  useGetSystemStatsQuery,
  useGetSystemHealthQuery,
  useGetAllUsersAdminQuery,
  useForceLogoutUserMutation,
  useUnlockUserAccountMutation,
  useResetUserPasswordMutation,
  useChangeUserRoleMutation,
  useGetRbacMatrixQuery,
  useGetSuperAdminAuditLogsQuery,
  usePurgeAuditLogsMutation,
  useGetSystemLogsQuery,
  useGetLogFilesQuery,
  useListBackupsQuery,
  useCreateBackupMutation,
  useDeleteBackupMutation,
  useGetCompaniesOverviewQuery,
  useListAllCompaniesQuery,
  useGetCompanyAdminQuery,
  useCreateCompanyAdminMutation,
  useUpdateCompanyAdminMutation,
  useSuspendCompanyMutation,
  useActivateCompanyMutation,
  useDeleteCompanyAdminMutation,
} = superAdminApi;
