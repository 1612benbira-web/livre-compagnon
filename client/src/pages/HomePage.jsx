import { useState } from 'react';
import { BookOpen, QrCode, Lightbulb, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { EmptyState, ErrorMessage, Spinner } from '../components/common/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { coverSrc } from '../utils/cover.js';
import { bookService } from '../services/content.js';

export function BookCover({ book, className = '' }) {
  const [failed, setFailed] = useState(false);
  const src = coverSrc(book);
  if (src && !failed) {
    return <img src={src} alt={`Couverture du livre ${book.title}`} onError={() => setFailed(true)} className={`rounded-3xl object-cover shadow-lg ${className}`} />;
  }
  return (
    <div className={`flex items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-mint-600 text-white shadow-lg ${className}`} role="img" aria-label="Illustration de livre">
      <BookOpen className="h-20 w-20" aria-hidden="true" />
    </div>
  );
}

const steps = [
  { icon: QrCode, title: 'Scanne', text: 'Le QR code du livre t’emmène ici.' },
  { icon: Lightbulb, title: 'Réponds', text: 'Une nouvelle question chaque jour.' },
  { icon: TrendingUp, title: 'Progresse', text: 'Découvre l’explication et suis tes progrès.' },
];

export default function HomePage() {
  const { user } = useAuth();
  // Configuration « livre unique » : on présente le premier livre publié
  const { data, loading, error, reload } = useFetch(() => bookService.list(), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;
  const book = data.books[0];
  if (!book) return <EmptyState title="Bientôt disponible" text="Le livre n’est pas encore publié. Reviens très vite !" />;

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <BookCover book={book} className="mx-auto aspect-[3/4] w-56 sm:w-64 md:order-2 md:w-72" />
        <div className="text-center md:text-left">
          <p className="font-extrabold text-mint-700">Bienvenue !</p>
          <h1 className="mt-1 text-4xl font-extrabold leading-tight text-brand-700 sm:text-5xl">{book.title}</h1>
          <p className="mt-4 text-lg">{book.description || 'Découvre une nouvelle question chaque jour et progresse à ton rythme.'}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            <Button variant="accent" to="/question-du-jour" className="text-lg">Commencer</Button>
            {user ? (
              <Button variant="secondary" to="/espace">Mon espace</Button>
            ) : (
              <Button variant="secondary" to="/connexion">Se connecter</Button>
            )}
          </div>
          {!user && (
            <p className="mt-4 text-sm">
              Pas encore de compte ? <Link to="/inscription" className="font-extrabold text-brand-700 underline">Inscris-toi</Link> pour garder ta progression.
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="comment">
        <h2 id="comment" className="mb-4 text-center text-2xl font-extrabold">Comment ça marche ?</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <Card className="h-full text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-extrabold">{i + 1}. {title}</h3>
                <p className="mt-1">{text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
