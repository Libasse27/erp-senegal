import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle, setBreadcrumbs } from '../redux/slices/uiSlice';

/**
 * Set page title and breadcrumbs
 * @param {string} title - Page title
 * @param {Array} breadcrumbs - Breadcrumb items [{label, path}]
 */
const usePageTitle = (title, breadcrumbs = []) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle(title));
    dispatch(setBreadcrumbs(breadcrumbs));
    document.title = `${title} | ERP Senegal`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, dispatch]);
};

export default usePageTitle;
