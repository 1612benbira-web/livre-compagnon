import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDashed } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Feedback.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { questionService } from '../services/content.js';
import { formatDateKey, toDateInput } from '../utils/format.js';

// Toutes les questions disponibles (y compris celles des jours précédents) : permet de rattraper
// celles qui n'ont pas été faites, et de retrouver celles déjà répondues.
export default function QuestionsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => questionService.list(page, 10), [page, user?._id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;
  if (!data.questions.length && page === 1) {
    return (
      <EmptyState title="Aucune question pour le moment" text="Reviens bientôt : de nouvelles questions arrivent.">
        <Button to="/">Retour à l’accueil</Button>
      </EmptyState>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold text-brand-700">Toutes les questions</h1>
        <p className="mt-1 text-lg">Retrouve ici toutes les questions disponibles, même celles des jours précédents.</p>
      </header>
      {!user && (
        <p className="rounded-2xl bg-sun-100 p-3 font-bold">
          <Link to="/inscription" state={{ from: '/questions' }} className="underline">Crée un compte</Link> pour enregistrer tes réponses et suivre ta progression.
        </p>
      )}
      <ul className="space-y-3">
        {data.questions.map((q) => (
          <li key={q.id}>
            <Card className="flex flex-col gap-3 !p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink/60 capitalize">{q.publicationDate ? formatDateKey(toDateInput(q.publicationDate)) : ''}</p>
                <p className="text-lg font-extrabold">{q.question}</p>
                <p className={`mt-1 inline-flex items-center gap-1 text-sm font-extrabold ${q.alreadyAnswered ? 'text-mint-700' : 'text-amber-900'}`}>
                  {q.alreadyAnswered
                    ? <><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Déjà répondue</>
                    : <><CircleDashed className="h-4 w-4" aria-hidden="true" /> À faire</>}
                </p>
              </div>
              {q.alreadyAnswered
                ? <Button variant="secondary" to={`/resultat/${q.answerId}`} className="shrink-0">Voir mon résultat</Button>
                : <Button variant="accent" to={`/questions/${q.id}`} className="shrink-0">Répondre</Button>}
            </Card>
          </li>
        ))}
      </ul>
      <Pagination pagination={data.pagination} onChange={setPage} />
    </div>
  );
}
