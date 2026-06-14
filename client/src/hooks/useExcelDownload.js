import { useState } from 'react';
import { toast } from 'react-toastify';
import store from '../redux/store';

const useExcelDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadExcel = async (apiPath, filename) => {
    setIsDownloading(true);
    try {
      const token = store.getState().auth.accessToken;
      const res = await fetch(`/api${apiPath}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erreur ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'export.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || 'Erreur lors du téléchargement');
    } finally {
      setIsDownloading(false);
    }
  };

  return { downloadExcel, isDownloading };
};

export default useExcelDownload;
