import { CalendarCheck, CheckCircle2, ClipboardList, Percent, XCircle } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Feedback.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import StatCard from '../components/common/StatCard.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { answerService } from '../services/content.js';
import { encouragement } from '../utils/format.js';

export default function ProgressPage() {
  const { data: p, loading, error, reload } = useFetch(() => answerService.progress(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  if (!p.answered) {
    return (
      <EmptyState title="Ta progression commence ici" text={encouragement(0, 0)}>
        <Button variant="accent" to="/question-du-jour">Répondre à la question du jour</Button>
      </EmptyState>
    );
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-extrabold text-brand-700">Ma progression</h1>
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3" aria-label="Statistiques">
        <StatCard icon={ClipboardList} label="Questions répondues" value={p.answered} />
        <StatCard icon={CheckCircle2} label="Réponses correctes" value={p.correct} tone="mint" />
        <StatCard icon={XCircle} label="À revoir" value={p.incorrect} tone="sun" />
        <StatCard icon={Percent} label="Taux de réussite" value={`${p.successRate} %`} tone="mint" />
        <StatCard icon={CalendarCheck} label="Jours actifs" value={p.activeDays} />
      </section>
      <Card>
        <h2 className="text-xl font-extrabold">Questions faites</h2>
        <p className="mb-3 text-ink/80">{p.answered} sur {p.availableQuestions} questions disponibles</p>
        <ProgressBar value={p.progressPercent} label="Progression générale" />
        <p className="mt-4 text-lg font-bold">{encouragement(p.successRate, p.answered)}</p>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Button variant="accent" to="/question-du-jour">Question du jour</Button>
        <Button variant="secondary" to="/historique">Mon historique</Button>
      </div>
    </div>
  );
}
