import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCredentials,
  logout as logoutAction,
  setLoading,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAccessToken,
  selectAuthLoading,
  selectAuthScope,
} from '../redux/slices/authSlice';
import { useGetMeQuery, useLogoutMutation } from '../redux/api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const accessToken = useSelector(selectAccessToken);
  const isLoading = useSelector(selectAuthLoading);
  const scope = useSelector(selectAuthScope);

  const {
    data: meData,
    isLoading: isMeLoading,
    isError: isMeError,
  } = useGetMeQuery(undefined, {
    skip: !accessToken,
  });

  const [logoutMutation] = useLogoutMutation();

  useEffect(() => {
    if (meData?.data) {
      dispatch(setCredentials({ user: meData.data, accessToken }));
    } else if (!accessToken) {
      // Pas de token — terminer le chargement immédiatement
      dispatch(setLoading(false));
    } else if (isMeError) {
      // Token invalide ou expiré non récupérable — nettoyer la session
      dispatch(logoutAction());
    }
  }, [meData, accessToken, isMeError, dispatch]);

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Déconnexion locale même si l'appel API échoue
    }
    dispatch(logoutAction());
  };

  const isSuperAdmin = () => {
    return user?.role?.name === 'super_admin' || scope === 'PLATFORM';
  };

  const hasPermission = (permissionCode) => {
    if (!user || !user.role) return false;
    const roleName = user.role.name;
    if (roleName === 'super_admin' || roleName === 'admin') return true;
    if (!user.role.permissions) return false;
    return user.role.permissions.some(
      (perm) => perm.code === permissionCode && perm.isActive
    );
  };

  const hasRole = (...roles) => {
    if (!user || !user.role) return false;
    if (user.role.name === 'super_admin') return true;
    return roles.includes(user.role.name);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading: isLoading || isMeLoading,
    scope,
    logout,
    isSuperAdmin,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
};
