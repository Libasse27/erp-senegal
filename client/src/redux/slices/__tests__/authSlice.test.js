import authReducer, {
  setCredentials,
  setAccessToken,
  setUser,
  logout,
  setLoading,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAccessToken,
  selectAuthLoading,
} from '../authSlice';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('authSlice', () => {
  const initialState = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  };

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('reducers', () => {
    it('should return initial state', () => {
      const state = authReducer(undefined, { type: 'unknown' });
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(true);
    });

    it('should handle setCredentials', () => {
      const payload = {
        user: { _id: '1', firstName: 'Test', email: 'test@test.com' },
        accessToken: 'jwt-token-123',
      };
      const state = authReducer(initialState, setCredentials(payload));

      expect(state.user).toEqual(payload.user);
      expect(state.accessToken).toBe('jwt-token-123');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'jwt-token-123');
    });

    it('should handle setAccessToken', () => {
      const state = authReducer(initialState, setAccessToken('new-token'));
      expect(state.accessToken).toBe('new-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'new-token');
    });

    it('should handle setUser', () => {
      const user = { _id: '1', firstName: 'Updated' };
      const state = authReducer(initialState, setUser(user));

      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle logout', () => {
      const loggedInState = {
        user: { _id: '1', firstName: 'Test' },
        accessToken: 'token',
        isAuthenticated: true,
        isLoading: false,
      };
      const state = authReducer(loggedInState, logout());

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    });

    it('should handle setLoading', () => {
      const state = authReducer(initialState, setLoading(false));
      expect(state.isLoading).toBe(false);
    });
  });

  describe('selectors', () => {
    const rootState = {
      auth: {
        user: { _id: '1', firstName: 'Test' },
        accessToken: 'token',
        isAuthenticated: true,
        isLoading: false,
      },
    };

    it('selectCurrentUser returns user', () => {
      expect(selectCurrentUser(rootState)).toEqual({ _id: '1', firstName: 'Test' });
    });

    it('selectIsAuthenticated returns auth status', () => {
      expect(selectIsAuthenticated(rootState)).toBe(true);
    });

    it('selectAccessToken returns token', () => {
      expect(selectAccessToken(rootState)).toBe('token');
    });

    it('selectAuthLoading returns loading state', () => {
      expect(selectAuthLoading(rootState)).toBe(false);
    });
  });
});
