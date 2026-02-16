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
} from '../redux/slices/authSlice';
import { useGetMeQuery, useLogoutMutation } from '../redux/api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const accessToken = useSelector(selectAccessToken);
  const isLoading = useSelector(selectAuthLoading);

  const { data: meData, isLoading: isMeLoading } = useGetMeQuery(undefined, {
    skip: !accessToken,
  });
  const [logoutMutation] = useLogoutMutation();

  useEffect(() => {
    if (meData?.data) {
      dispatch(
        setCredentials({
          user: meData.data,
          accessToken,
        })
      );
    } else if (!accessToken) {
      dispatch(setLoading(false));
    }
  }, [meData, accessToken, dispatch]);

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Logout even if API call fails
    }
    dispatch(logoutAction());
  };

  const hasPermission = (permissionCode) => {
    if (!user || !user.role) return false;
    if (user.role.name === 'admin') return true;
    if (!user.role.permissions) return false;
    return user.role.permissions.some(
      (perm) => perm.code === permissionCode && perm.isActive
    );
  };

  const hasRole = (...roles) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role.name);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading: isLoading || isMeLoading,
    logout,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
