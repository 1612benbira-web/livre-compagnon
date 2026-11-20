import { useSearchParams, Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { Alert, EmptyState, ErrorMessage, Spinner } from '../components/common/Feedback.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import QuestionCard from '../components/questions/QuestionCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { answerService, questionService } from '../services/content.js';
import { formatDateKey } from '../utils/format.js';

export default function QuestionPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const book = params.get('book') || undefined;

  const { data, loading, error, reload } = useFetch(() => questionService.today(book), [book, user?._id]);
  const progress = useFetch(() => (user ? answerService.progress() : Promise.resolve(null)), [user?._id]);

  if (loading) return <Spinner label="Recherche de la question du jour…" />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  const { question, dateKey, isFallback, alreadyAnswered, answerId } = data;
  if (!question) {
    return (
      <EmptyState title="Pas de question aujourd’hui" text="Aucune question n’est disponible pour le moment. Reviens demain, ou jette un œil à ce que tu as déjà fait !">
        <Button to="/questions">Toutes les questions</Button>
        <Button variant="secondary" to="/progression">Ma progression</Button>
      </EmptyState>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-brand-700">Question du jour</h1>
        <p className="mt-1 inline-flex items-center gap-2 font-bold text-ink/70">
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
          <span className="capitalize">{formatDateKey(dateKey)}</span>
        </p>
      </header>

      {user && progress.data && (
        <Card className="!p-4">
          <p className="mb-2 font-bold">
            Ta progression : {progress.data.answered} / {progress.data.availableQuestions} questions
            {progress.data.answered < progress.data.availableQuestions && (
              <> — <Link to="/questions" className="font-extrabold text-brand-700 underline">voir celles qui restent</Link></>
            )}
          </p>
          <ProgressBar value={progress.data.progressPercent} label="Progression générale" />
        </Card>
      )}

      {isFallback && <Alert type="success">Pas de nouvelle question aujourd’hui : voici la dernière question disponible.</Alert>}

      <QuestionCard key={question.id} question={question} alreadyAnswered={alreadyAnswered} answerId={answerId} onConflict={reload} />

      <p className="text-center text-sm">
        <Link to="/questions" className="font-bold text-brand-700 underline">Toutes les questions</Link>
        <span className="mx-2">·</span>
        <Link to="/" className="font-bold text-brand-700 underline">Retour à l’accueil</Link>
      </p>
    </div>
  );
}
