import { AlertTriangle, CheckCircle2, Inbox, Loader2 } from 'lucide-react';
import Button from './Button.jsx';
import Card from './Card.jsx';

export function Spinner({ label = 'Chargement…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-brand-700">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <span className="font-bold">{label}</span>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <Card className="mx-auto max-w-xl text-center" role="alert">
      <AlertTriangle className="mx-auto h-10 w-10 text-red-700" aria-hidden="true" />
      <p className="mt-3 text-lg font-bold">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </Card>
  );
}

export function EmptyState({ title, text, children }) {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <Inbox className="mx-auto h-12 w-12 text-brand-500" aria-hidden="true" />
      <h2 className="mt-3 text-xl font-extrabold">{title}</h2>
      {text && <p className="mt-2 text-ink/80">{text}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>}
    </Card>
  );
}

export function Alert({ type = 'error', children }) {
  const styles =
    type === 'success'
      ? 'bg-mint-50 text-mint-700 ring-mint-100'
      : 'bg-red-50 text-red-800 ring-red-200';
  const Icon = type === 'success' ? CheckCircle2 : AlertTriangle;
  return (
    <div role={type === 'success' ? 'status' : 'alert'} className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-bold ring-1 ${styles}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
