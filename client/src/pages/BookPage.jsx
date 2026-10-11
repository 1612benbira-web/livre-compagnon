import { useParams } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { ErrorMessage, Spinner } from '../components/common/Feedback.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { bookService } from '../services/content.js';
import { BookCover } from './HomePage.jsx';

export default function BookPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(() => bookService.get(id), [id]);
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;
  const { book } = data;
  return (
    <Card className="mx-auto grid max-w-3xl items-center gap-6 sm:grid-cols-[14rem_1fr]">
      <BookCover book={book} className="mx-auto aspect-[3/4] w-48 sm:w-56" />
      <div>
        <h1 className="text-3xl font-extrabold text-brand-700">{book.title}</h1>
        {book.author && <p className="mt-1 font-bold text-ink/70">de {book.author}</p>}
        <p className="mt-3">{book.description}</p>
        <Button variant="accent" to={`/question-du-jour?book=${encodeURIComponent(id)}`} className="mt-5">Découvrir les questions</Button>
      </div>
    </Card>
  );
}
