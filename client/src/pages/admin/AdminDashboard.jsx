import { CheckCircle2, HelpCircle, ListChecks, Percent, UserCheck, Users } from 'lucide-react';
import { ResultBadge } from '../../components/common/Badge.jsx';
import Card from '../../components/common/Card.jsx';
import { ErrorMessage, Spinner } from '../../components/common/Feedback.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { adminService } from '../../services/admin.js';
import { formatDateTime } from '../../utils/format.js';

export default function AdminDashboard() {
  const { data: d, loading, error, reload } = useFetch(() => adminService.dashboard(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-brand-700">Tableau de bord</h1>
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3" aria-label="Indicateurs">
        <StatCard icon={Users} label="Utilisateurs" value={d.totalUsers} />
        <StatCard icon={HelpCircle} label={`Questions (${d.publishedQuestions} publiées)`} value={d.totalQuestions} tone="sun" />
        <StatCard icon={ListChecks} label="Réponses" value={d.totalAnswers} />
        <StatCard icon={Percent} label="Taux de réussite" value={`${d.successRate} %`} tone="mint" />
        <StatCard icon={UserCheck} label="Actifs (7 derniers jours)" value={d.activeUsersLast7Days} tone="mint" />
      </section>
      <Card>
        <h2 className="mb-3 text-xl font-extrabold">Dernières réponses</h2>
        {!d.recentAnswers.length ? (
          <p>Aucune réponse pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left">
              <thead className="text-brand-700"><tr><th className="p-2">Date</th><th className="p-2">Lecteur</th><th className="p-2">Question</th><th className="p-2">Résultat</th></tr></thead>
              <tbody>
                {d.recentAnswers.map((a) => (
                  <tr key={a.id} className="border-t border-black/5">
                    <td className="p-2 whitespace-nowrap">{formatDateTime(a.answeredAt)}</td>
                    <td className="p-2 font-bold">{a.firstName}</td>
                    <td className="p-2">{a.question}</td>
                    <td className="p-2"><ResultBadge isCorrect={a.isCorrect} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="flex items-center gap-2 text-sm text-ink/70"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Chiffres calculés en direct depuis la base de données.</p>
    </div>
  );
}
