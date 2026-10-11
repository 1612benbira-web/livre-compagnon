import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button.jsx';

export default function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages } = pagination;
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3">
      <Button variant="secondary" className="px-4" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Page précédente">
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </Button>
      <span className="font-bold">
        Page {page} sur {totalPages}
      </span>
      <Button variant="secondary" className="px-4" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Page suivante">
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </Button>
    </nav>
  );
}
