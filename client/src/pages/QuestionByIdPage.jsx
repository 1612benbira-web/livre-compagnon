import { Link, useParams } from 'react-router-dom';
import { ErrorMessage, Spinner } from '../components/common/Feedback.jsx';
import QuestionCard from '../components/questions/QuestionCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { questionService } from '../services/content.js';
import { formatDateKey, toDateInput } from '../utils/format.js';

export default function QuestionByIdPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => questionService.get(id), [id, user?.id]);
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  const { question, alreadyAnswered, answerId } = data;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-brand-700">Question</h1>
        {question.publicationDate && <p className="mt-1 font-bold capitalize text-ink/70">{formatDateKey(toDateInput(question.publicationDate))}</p>}
      </header>
      <QuestionCard key={question.id} question={question} alreadyAnswered={alreadyAnswered} answerId={answerId} onConflict={reload} />
      <p className="text-center text-sm"><Link to="/questions" className="font-bold text-brand-700 underline">Toutes les questions</Link></p>
    </div>
  );
}
