import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, UserPlus } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { Alert, EmptyState, ErrorMessage, Spinner } from '../components/common/Feedback.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { getErrorMessage, getStatus } from '../services/api.js';
import { answerService, questionService } from '../services/content.js';
import { LETTERS, formatDateKey } from '../utils/format.js';

export default function QuestionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const book = params.get('book') || undefined;

  const { data, loading, error, reload } = useFetch(() => questionService.today(book), [book, user?.id]);
  const progress = useFetch(() => (user ? answerService.progress() : Promise.resolve(null)), [user?.id]);

  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [needAccount, setNeedAccount] = useState(false);

  if (loading) return <Spinner label="Recherche de la question du jour…" />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  const { question, dateKey, isFallback, alreadyAnswered, answerId } = data;
  if (!question) {
    return (
      <EmptyState title="Pas de question aujourd’hui" text="Aucune question n’est disponible pour le moment. Reviens demain, ou jette un œil à ce que tu as déjà fait !">
        <Button to="/progression">Ma progression</Button>
        <Button variant="secondary" to="/historique">Mon historique</Button>
      </EmptyState>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (selected === null) {
      setSubmitError('Choisis une réponse avant de valider.');
      return;
    }
    if (!user) {
      setNeedAccount(true); // invitation à s'inscrire au moment opportun
      return;
    }
    setSubmitting(true);
    try {
      const { result } = await answerService.submit(question.id, selected);
      navigate(`/resultat/${result.id}`);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      if (getStatus(err) === 409) reload();
    } finally {
      setSubmitting(false);
    }
  };

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
          <p className="mb-2 font-bold">Ta progression : {progress.data.answered} / {progress.data.availableQuestions} questions</p>
          <ProgressBar value={progress.data.progressPercent} label="Progression générale" />
        </Card>
      )}

      {isFallback && <Alert type="success">Pas de nouvelle question aujourd’hui : voici la dernière question disponible.</Alert>}

      <Card as="form" onSubmit={submit} noValidate className="pop-in">
        {alreadyAnswered && (
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-mint-100 px-3 py-1 font-extrabold text-mint-700">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Déjà répondue
          </p>
        )}
        <fieldset disabled={alreadyAnswered || submitting}>
          <legend className="mb-4 text-2xl font-extrabold leading-snug">{question.question}</legend>
          <div className="space-y-3">
            {question.answers.map((text, i) => (
              <label key={i} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-lg font-bold transition has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:disabled]:cursor-default ${selected === i ? 'border-brand-600' : 'border-brand-100 hover:border-brand-500'}`}>
                <input type="radio" name="answer" value={i} checked={selected === i} onChange={() => { setSelected(i); setSubmitError(''); }} className="h-5 w-5 accent-brand-600" />
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sun-100 font-extrabold" aria-hidden="true">{LETTERS[i]}</span>
                <span>{text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {submitError && <div className="mt-4"><Alert>{submitError}</Alert></div>}

        {alreadyAnswered ? (
          <Button variant="primary" to={`/resultat/${answerId}`} className="mt-6 w-full">Voir mon résultat</Button>
        ) : (
          <Button type="submit" variant="accent" disabled={submitting} className="mt-6 w-full text-lg">
            {submitting ? 'Envoi…' : 'Valider ma réponse'}
          </Button>
        )}
      </Card>

      {needAccount && !user && (
        <Card className="pop-in border-2 border-sun-400 text-center" role="dialog" aria-label="Créer un compte">
          <UserPlus className="mx-auto h-10 w-10 text-brand-600" aria-hidden="true" />
          <h2 className="mt-2 text-xl font-extrabold">Pour enregistrer ta réponse, il te faut un compte</h2>
          <p className="mt-1">C’est gratuit et rapide. Ta progression sera sauvegardée.</p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="accent" to="/inscription" state={{ from: '/question-du-jour' }}>Créer un compte</Button>
            <Button variant="secondary" to="/connexion" state={{ from: '/question-du-jour' }}>J’ai déjà un compte</Button>
          </div>
        </Card>
      )}
      <p className="text-center text-sm"><Link to="/" className="font-bold text-brand-700 underline">Retour à l’accueil</Link></p>
    </div>
  );
}
