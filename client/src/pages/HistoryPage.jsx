import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { ResultBadge } from '../components/common/Badge.jsx';
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Feedback.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { answerService } from '../services/content.js';
import { formatDateTime } from '../utils/format.js';

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => answerService.history(page, 10), [page]);
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;
  if (!data.history.length && page === 1) {
    return (
      <EmptyState title="Pas encore d’historique" text="Tes réponses apparaîtront ici dès ta première question.">
        <Button variant="accent" to="/question-du-jour">Répondre à une question</Button>
      </EmptyState>
    );
  }
  const chosen = (h) => h.question?.answers[h.selectedAnswer] ?? '—';
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold text-brand-700">Mon historique</h1>

      <div className="hidden overflow-x-auto rounded-3xl bg-white shadow-md ring-1 ring-black/5 md:block">
        <table className="w-full text-left">
          <caption className="sr-only">Historique de tes réponses, de la plus récente à la plus ancienne</caption>
          <thead className="bg-brand-50 text-brand-700">
            <tr><th className="p-4">Date</th><th className="p-4">Question</th><th className="p-4">Ta réponse</th><th className="p-4">Résultat</th><th className="p-4"><span className="sr-only">Détail</span></th></tr>
          </thead>
          <tbody>
            {data.history.map((h) => (
              <tr key={h.id} className="border-t border-black/5">
                <td className="p-4 whitespace-nowrap">{formatDateTime(h.answeredAt)}</td>
                <td className="p-4 font-bold">{h.question?.question}</td>
                <td className="p-4">{chosen(h)}</td>
                <td className="p-4"><ResultBadge isCorrect={h.isCorrect} /></td>
                <td className="p-4"><Link to={`/resultat/${h.id}`} className="font-extrabold text-brand-700 underline">Détail</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {data.history.map((h) => (
          <li key={h.id}>
            <Card className="!p-4">
              <p className="text-sm text-ink/70">{formatDateTime(h.answeredAt)}</p>
              <p className="mt-1 font-extrabold">{h.question?.question}</p>
              <p className="mt-1">Ta réponse : <strong>{chosen(h)}</strong></p>
              <div className="mt-3 flex items-center justify-between">
                <ResultBadge isCorrect={h.isCorrect} />
                <Link to={`/resultat/${h.id}`} className="font-extrabold text-brand-700 underline">Voir le détail</Link>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <Pagination pagination={data.pagination} onChange={setPage} />
    </div>
  );
}
