import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // cookie de session HttpOnly
  timeout: 15000,
});

// Données utiles d'une réponse { success, data, message }
export const unwrap = (promise) => promise.then((res) => res.data.data);

export function getErrorMessage(err, fallback = 'Une erreur est survenue. Réessaie dans un instant.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED') {
    return 'Impossible de joindre le serveur. Vérifie ta connexion.';
  }
  return fallback;
}

export const getStatus = (err) => err?.response?.status;
