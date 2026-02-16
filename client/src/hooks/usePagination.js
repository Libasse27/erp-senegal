import { useState, useCallback } from 'react';
import APP_CONFIG from '../config/app.config';

/**
 * Manage pagination state for API-driven lists
 */
const usePagination = (defaultLimit = APP_CONFIG.DEFAULT_PAGE_SIZE) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [sort, setSort] = useState('-createdAt');
  const [search, setSearch] = useState('');

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((newSort) => {
    setSort(newSort);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((newSearch) => {
    setSearch(newSearch);
    setPage(1);
  }, []);

  const resetPagination = useCallback(() => {
    setPage(1);
    setSearch('');
    setSort('-createdAt');
  }, []);

  const queryParams = {
    page,
    limit,
    sort,
    ...(search && { search }),
  };

  return {
    page,
    limit,
    sort,
    search,
    queryParams,
    handlePageChange,
    handleLimitChange,
    handleSortChange,
    handleSearchChange,
    resetPagination,
  };
};

export default usePagination;
