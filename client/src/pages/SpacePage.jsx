import { CheckCircle2, ClipboardList, History, Percent, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { ErrorMessage, Spinner } from '../components/common/Feedback.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import StatCard from '../components/common/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { answerService, questionService } from '../services/content.js';

export default function SpacePage() {
  const { user, isAdmin } = useAuth();
  const progress = useFetch(() => answerService.progress(), []);
  const today = useFetch(() => questionService.today(), []);

  if (progress.loading) return <Spinner />;
  if (progress.error) return <ErrorMessage message={progress.error} onRetry={progress.reload} />;
  const p = progress.data;
  const t = today.data;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-brand-700">Bonjour {user.firstName} !</h1>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Statistiques">
        <StatCard icon={ClipboardList} label="Questions répondues" value={p.answered} />
        <StatCard icon={CheckCircle2} label="Bonnes réponses" value={p.correct} tone="mint" />
        <StatCard icon={Percent} label="Taux de réussite" value={`${p.successRate} %`} tone="sun" />
      </section>

      <Card>
        <h2 className="mb-3 text-xl font-extrabold">Progression générale</h2>
        <ProgressBar value={p.progressPercent} label="Progression générale" />
      </Card>

      <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Question du jour</h2>
          <p className="text-ink/80">
            {!t?.question ? 'Pas de question disponible pour le moment.' : t.alreadyAnswered ? 'Tu as déjà répondu, bravo ! Reviens demain.' : 'Une nouvelle question t’attend.'}
          </p>
        </div>
        <Button variant="accent" to="/question-du-jour">{t?.question && !t.alreadyAnswered ? 'Répondre' : 'Voir'}</Button>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" to="/historique"><History className="h-5 w-5" aria-hidden="true" /> Historique</Button>
        <Button variant="secondary" to="/profil"><User className="h-5 w-5" aria-hidden="true" /> Mon profil</Button>
        {isAdmin && <Link to="/admin" className="inline-flex min-h-12 items-center px-3 font-extrabold text-brand-700 underline">Administration</Link>}
      </div>
    </div>
  );
}
