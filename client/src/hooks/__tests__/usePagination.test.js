import { renderHook, act } from '@testing-library/react';
import usePagination from '../usePagination';

// Mock the app config
jest.mock('../../config/app.config', () => ({
  __esModule: true,
  default: {
    DEFAULT_PAGE_SIZE: 25,
  },
}));

describe('usePagination', () => {
  describe('Initial state', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => usePagination());

      expect(result.current.page).toBe(1);
      expect(result.current.limit).toBe(25);
      expect(result.current.sort).toBe('-createdAt');
      expect(result.current.search).toBe('');
    });

    it('initializes with custom default limit', () => {
      const { result } = renderHook(() => usePagination(50));

      expect(result.current.limit).toBe(50);
    });

    it('returns correct queryParams object', () => {
      const { result } = renderHook(() => usePagination());

      expect(result.current.queryParams).toEqual({
        page: 1,
        limit: 25,
        sort: '-createdAt',
      });
    });
  });

  describe('handlePageChange', () => {
    it('updates page when handlePageChange is called', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handlePageChange(3);
      });

      expect(result.current.page).toBe(3);
    });

    it('updates queryParams when page changes', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handlePageChange(2);
      });

      expect(result.current.queryParams.page).toBe(2);
    });
  });

  describe('handleLimitChange', () => {
    it('updates limit when handleLimitChange is called', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handleLimitChange(50);
      });

      expect(result.current.limit).toBe(50);
    });

    it('resets page to 1 when limit changes', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handlePageChange(5);
      });

      expect(result.current.page).toBe(5);

      act(() => {
        result.current.handleLimitChange(50);
      });

      expect(result.current.page).toBe(1);
      expect(result.current.limit).toBe(50);
    });

    it('updates queryParams when limit changes', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handleLimitChange(100);
      });

      expect(result.current.queryParams.limit).toBe(100);
    });
  });

  describe('handleSortChange', () => {
    it('updates sort when handleSortChange is called', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handleSortChange('name');
      });

      expect(result.current.sort).toBe('name');
    });

    it('resets page to 1 when sort changes', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handlePageChange(3);
      });

      expect(result.current.page).toBe(3);

      act(() => {
        result.current.handleSortChange('-name');
      });

      expect(result.current.page).toBe(1);
      expect(result.current.sort).toBe('-name');
    });

    it('updates queryParams when sort changes', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handleSortChange('price');
      });

      expect(result.current.queryParams.sort).toBe('price');
    });
  });

  describe('handleSearchChange', () => {
    it('updates search when handleSearchChange is called', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handleSearchChange('test query');
      });

      expect(result.current.search).toBe('test query');
    });

    it('resets page to 1 when search changes', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handlePageChange(4);
      });

      expect(result.current.page).toBe(4);

      act(() => {
        result.current.handleSearchChange('search term');
      });

      expect(result.current.page).toBe(1);
      expect(result.current.search).toBe('search term');
    });

    it('includes search in queryParams when not empty', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handleSearchChange('test');
      });

      expect(result.current.queryParams).toEqual({
        page: 1,
        limit: 25,
        sort: '-createdAt',
        search: 'test',
      });
    });

    it('excludes search from queryParams when empty', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handleSearchChange('test');
        result.current.handleSearchChange('');
      });

      expect(result.current.queryParams).toEqual({
        page: 1,
        limit: 25,
        sort: '-createdAt',
      });
    });
  });

  describe('resetPagination', () => {
    it('resets all values to initial state', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handlePageChange(5);
        result.current.handleLimitChange(50);
        result.current.handleSortChange('name');
        result.current.handleSearchChange('test');
      });

      expect(result.current.page).toBe(1);
      expect(result.current.limit).toBe(50);
      expect(result.current.sort).toBe('name');
      expect(result.current.search).toBe('test');

      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.page).toBe(1);
      expect(result.current.limit).toBe(50); // limit is NOT reset
      expect(result.current.sort).toBe('-createdAt');
      expect(result.current.search).toBe('');
    });
  });

  describe('Handler stability', () => {
    it('handlers remain stable across re-renders', () => {
      const { result, rerender } = renderHook(() => usePagination());

      const handlers = {
        handlePageChange: result.current.handlePageChange,
        handleLimitChange: result.current.handleLimitChange,
        handleSortChange: result.current.handleSortChange,
        handleSearchChange: result.current.handleSearchChange,
        resetPagination: result.current.resetPagination,
      };

      rerender();

      expect(result.current.handlePageChange).toBe(handlers.handlePageChange);
      expect(result.current.handleLimitChange).toBe(handlers.handleLimitChange);
      expect(result.current.handleSortChange).toBe(handlers.handleSortChange);
      expect(result.current.handleSearchChange).toBe(handlers.handleSearchChange);
      expect(result.current.resetPagination).toBe(handlers.resetPagination);
    });
  });

  describe('Complex scenarios', () => {
    it('handles multiple state changes correctly', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handlePageChange(3);
        result.current.handleLimitChange(10);
        result.current.handleSortChange('price');
        result.current.handleSearchChange('laptop');
      });

      expect(result.current.queryParams).toEqual({
        page: 1, // Reset by limit and sort and search changes
        limit: 10,
        sort: 'price',
        search: 'laptop',
      });
    });
  });
});
