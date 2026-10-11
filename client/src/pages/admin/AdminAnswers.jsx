import { useState } from 'react';
import { ResultBadge } from '../../components/common/Badge.jsx';
import Card from '../../components/common/Card.jsx';
import { EmptyState, ErrorMessage, Spinner } from '../../components/common/Feedback.jsx';
import { Field } from '../../components/common/Field.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { adminService } from '../../services/admin.js';
import { LETTERS, formatDateTime } from '../../utils/format.js';

export default function AdminAnswers() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ user: '', question: '', from: '', to: '', result: '' });
  const set = (key) => (e) => { setFilters((f) => ({ ...f, [key]: e.target.value })); setPage(1); };

  const users = useFetch(() => adminService.users({ limit: 50 }), []);
  const questions = useFetch(() => adminService.questions({ limit: 50 }), []);
  const { data, loading, error, reload } = useFetch(() => adminService.answers({ page, limit: 15, ...filters }), [page, filters]);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold text-brand-700">Réponses</h1>
      <Card className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field id="fUser" as="select" label="Lecteur" value={filters.user} onChange={set('user')}>
          <option value="">Tous</option>
          {users.data?.users.map((u) => <option key={u.id} value={u.id}>{u.firstName}</option>)}
        </Field>
        <Field id="fQuestion" as="select" label="Question" value={filters.question} onChange={set('question')}>
          <option value="">Toutes</option>
          {questions.data?.questions.map((q) => <option key={q._id} value={q._id}>{q.question.slice(0, 50)}</option>)}
        </Field>
        <Field id="fFrom" type="date" label="Du" value={filters.from} onChange={set('from')} />
        <Field id="fTo" type="date" label="Au" value={filters.to} onChange={set('to')} />
        <Field id="fResult" as="select" label="Résultat" value={filters.result} onChange={set('result')}>
          <option value="">Tous</option>
          <option value="correct">Correctes</option>
          <option value="incorrect">À revoir</option>
        </Field>
      </Card>

      {loading ? <Spinner /> : error ? <ErrorMessage message={error} onRetry={reload} /> : !data.answers.length ? (
        <EmptyState title="Aucune réponse" text="Aucune réponse ne correspond à ces filtres." />
      ) : (
        <>
          <Card className="overflow-x-auto !p-0">
            <table className="w-full min-w-[40rem] text-left">
              <thead className="bg-brand-50 text-brand-700"><tr><th className="p-3">Date</th><th className="p-3">Lecteur</th><th className="p-3">Question</th><th className="p-3">Choix</th><th className="p-3">Résultat</th></tr></thead>
              <tbody>
                {data.answers.map((a) => (
                  <tr key={a.id} className="border-t border-black/5">
                    <td className="p-3 whitespace-nowrap">{formatDateTime(a.answeredAt)}</td>
                    <td className="p-3 font-bold">{a.user?.firstName ?? '—'}</td>
                    <td className="p-3">{a.question?.question ?? '—'}</td>
                    <td className="p-3">{LETTERS[a.selectedAnswer]}</td>
                    <td className="p-3"><ResultBadge isCorrect={a.isCorrect} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination pagination={data.pagination} onChange={setPage} />
        </>
      )}
    </div>
  );
}
