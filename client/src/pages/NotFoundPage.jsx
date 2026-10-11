import Button from '../components/common/Button.jsx';
import { EmptyState } from '../components/common/Feedback.jsx';

export default function NotFoundPage() {
  return (
    <EmptyState title="Page introuvable" text="Oups, cette page n’existe pas (ou plus).">
      <Button to="/">Retour à l’accueil</Button>
    </EmptyState>
  );
}
