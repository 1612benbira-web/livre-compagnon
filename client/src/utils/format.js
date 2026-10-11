export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export const formatDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { dateStyle: 'medium' });

// dateKey "AAAA-MM-JJ" (jour de référence du serveur) → "samedi 10 octobre 2026"
export const formatDateKey = (key) =>
  new Date(`${key}T12:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });

export const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : '');

export const LETTERS = ['A', 'B', 'C', 'D'];

export const STATUS_LABELS = { draft: 'Brouillon', published: 'Publiée', archived: 'Archivée' };

export const encouragement = (rate, answered) => {
  if (!answered) return 'Réponds à ta première question pour démarrer ton aventure !';
  if (rate >= 80) return 'Quel talent ! Continue comme ça, tu es au top.';
  if (rate >= 50) return 'Très bien ! Tu progresses à chaque question.';
  return 'Continue tes efforts, tu progresses ! Chaque question t’apprend quelque chose.';
};
