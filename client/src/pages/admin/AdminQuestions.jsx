import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';
import { Alert, EmptyState, ErrorMessage, Spinner } from '../../components/common/Feedback.jsx';
import { Field } from '../../components/common/Field.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { getErrorMessage } from '../../services/api.js';
import { adminService } from '../../services/admin.js';
import { STATUS_LABELS, formatDate } from '../../utils/format.js';

export default function AdminQuestions() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [notice, setNotice] = useState({ type: '', text: '' });
  const { data, loading, error, reload } = useFetch(() => adminService.questions({ page, limit: 10, status }), [page, status]);

  const togglePublish = async (q) => {
    setNotice({ type: '', text: '' });
    try {
      await adminService.updateQuestion(q._id, { status: q.status === 'published' ? 'draft' : 'published' });
      reload();
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    }
  };
  const remove = async (q) => {
    if (!window.confirm(`Supprimer la question « ${q.question} » ? Cette action est irréversible.`)) return;
    setNotice({ type: '', text: '' });
    try {
      await adminService.deleteQuestion(q._id);
      setNotice({ type: 'success', text: 'Question supprimée.' });
      reload();
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-brand-700">Questions</h1>
        <Button variant="accent" to="/admin/questions/nouvelle"><Plus className="h-5 w-5" aria-hidden="true" /> Nouvelle question</Button>
      </div>
      <div className="max-w-xs">
        <Field id="statusFilter" as="select" label="Filtrer par statut" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Tous</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Field>
      </div>
      {notice.text && <Alert type={notice.type}>{notice.text}</Alert>}

      {loading ? <Spinner /> : error ? <ErrorMessage message={error} onRetry={reload} /> : !data.questions.length ? (
        <EmptyState title="Aucune question" text="Crée ta première question pour démarrer."><Button to="/admin/questions/nouvelle">Nouvelle question</Button></EmptyState>
      ) : (
        <>
          <ul className="space-y-3">
            {data.questions.map((q) => (
              <li key={q._id} className="rounded-3xl bg-white p-4 shadow-md ring-1 ring-black/5 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="font-extrabold">{q.question}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/70">
                    <StatusBadge status={q.status} label={STATUS_LABELS[q.status]} />
                    <span>Publication : {q.publicationDate ? formatDate(q.publicationDate) : '—'}</span>
                    <span>· {q.answerCount} réponse(s)</span>
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
                  <Link to={`/admin/questions/${q._id}/modifier`} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 font-extrabold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"><Pencil className="h-4 w-4" aria-hidden="true" /> Modifier</Link>
                  {q.status !== 'archived' && (
                    <button onClick={() => togglePublish(q)} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 font-extrabold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                      {q.status === 'published' ? <><EyeOff className="h-4 w-4" aria-hidden="true" /> Dépublier</> : <><Eye className="h-4 w-4" aria-hidden="true" /> Publier</>}
                    </button>
                  )}
                  <button onClick={() => remove(q)} disabled={q.answerCount > 0} title={q.answerCount > 0 ? 'Déjà répondue : archive-la au lieu de la supprimer' : 'Supprimer'} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 font-extrabold text-red-800 ring-1 ring-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination pagination={data.pagination} onChange={setPage} />
        </>
      )}
    </div>
  );
}
