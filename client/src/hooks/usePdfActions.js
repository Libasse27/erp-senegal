import { useState } from 'react';
import { toast } from 'react-toastify';
import store from '../redux/store';

const fetchPdfBlob = async (apiPath) => {
  const token = store.getState().auth.accessToken;
  const res = await fetch(`/api${apiPath}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Erreur ${res.status}`);
  }

  return await res.blob();
};

const usePdfActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const downloadPdf = async (apiPath, filename) => {
    setIsLoading(true);
    try {
      const blob = await fetchPdfBlob(apiPath);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || 'Erreur lors du telechargement du PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const printPdf = async (apiPath) => {
    setIsLoading(true);
    try {
      const blob = await fetchPdfBlob(apiPath);
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      } else {
        toast.warning('Veuillez autoriser les popups pour imprimer');
      }
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'impression");
    } finally {
      setIsLoading(false);
    }
  };

  const previewPdf = async (apiPath) => {
    setIsLoading(true);
    try {
      const blob = await fetchPdfBlob(apiPath);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      toast.error(err.message || "Erreur lors du chargement de l'apercu");
    } finally {
      setIsLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  return { downloadPdf, printPdf, previewPdf, closePreview, previewUrl, isLoading };
};

export default usePdfActions;
