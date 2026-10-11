import { CheckCircle2, XCircle } from 'lucide-react';

export function ResultBadge({ isCorrect }) {
  return isCorrect ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-mint-100 px-3 py-1 text-sm font-extrabold text-mint-700">
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Correcte
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-sun-100 px-3 py-1 text-sm font-extrabold text-amber-900">
      <XCircle className="h-4 w-4" aria-hidden="true" /> À revoir
    </span>
  );
}

const statusStyles = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-mint-100 text-mint-700',
  archived: 'bg-sun-100 text-amber-900',
};
export function StatusBadge({ status, label }) {
  return <span className={`inline-block rounded-full px-3 py-1 text-sm font-extrabold ${statusStyles[status]}`}>{label}</span>;
}
