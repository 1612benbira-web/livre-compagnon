import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, QrCode, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';
import { Alert, EmptyState, ErrorMessage, Spinner } from '../../components/common/Feedback.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { adminService } from '../../services/admin.js';
import { getErrorMessage } from '../../services/api.js';

export default function AdminBooks() {
  const { data, loading, error, reload } = useFetch(() => adminService.books(), []);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const remove = async (book) => {
    if (!window.confirm(`Supprimer le livre « ${book.title} » ? Son QR code ne mènera plus nulle part.`)) return;
    setNotice({ type: '', text: '' });
    try {
      await adminService.deleteBook(book._id);
      setNotice({ type: 'success', text: 'Livre supprimé.' });
      reload();
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-brand-700">Livres</h1>
        <Button variant="accent" to="/admin/livres/nouveau"><Plus className="h-5 w-5" aria-hidden="true" /> Nouveau livre</Button>
      </div>
      {notice.text && <Alert type={notice.type}>{notice.text}</Alert>}

      {loading ? <Spinner /> : error ? <ErrorMessage message={error} onRetry={reload} /> : !data.books.length ? (
        <EmptyState title="Aucun livre" text="Crée ton premier livre : son QR code sera généré automatiquement.">
          <Button to="/admin/livres/nouveau">Créer un livre</Button>
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {data.books.map((b) => (
            <li key={b._id} className="rounded-3xl bg-white p-4 shadow-md ring-1 ring-black/5 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-lg font-extrabold">{b.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/70">
                  <StatusBadge status={b.isPublished ? 'published' : 'draft'} label={b.isPublished ? 'Publié' : 'Non publié'} />
                  <span>/livre/{b.slug}</span>
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
                <Link to={`/admin/livres/${b._id}/qr`} className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-sun-100 px-3 font-extrabold text-ink hover:bg-sun-400"><QrCode className="h-4 w-4" aria-hidden="true" /> QR code</Link>
                <Link to={`/admin/livres/${b._id}/modifier`} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 font-extrabold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"><Pencil className="h-4 w-4" aria-hidden="true" /> Modifier</Link>
                <button onClick={() => remove(b)} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 font-extrabold text-red-800 ring-1 ring-red-200 hover:bg-red-50"><Trash2 className="h-4 w-4" aria-hidden="true" /> Supprimer</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
