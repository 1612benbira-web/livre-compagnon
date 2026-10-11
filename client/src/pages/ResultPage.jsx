import { CheckCircle2, Lightbulb, XCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { ErrorMessage, Spinner } from '../components/common/Feedback.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { answerService } from '../services/content.js';
import { LETTERS } from '../utils/format.js';

export default function ResultPage() {
  const { answerId } = useParams();
  const { data, loading, error, reload } = useFetch(() => answerService.get(answerId), [answerId]);
  const progress = useFetch(() => answerService.progress(), [answerId]);
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  const r = data.result;
  const ok = r.isCorrect;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card className={`pop-in text-center ${ok ? 'bg-mint-50' : 'bg-sun-100'}`} role="status">
        {ok ? <CheckCircle2 className="mx-auto h-14 w-14 text-mint-700" aria-hidden="true" /> : <Lightbulb className="mx-auto h-14 w-14 text-amber-800" aria-hidden="true" />}
        <h1 className="mt-2 text-3xl font-extrabold">{ok ? 'Bravo !' : 'Presque !'}</h1>
        <p className="mt-1 text-lg font-bold">
          {ok ? 'Tu as trouvé la bonne réponse.' : 'Ce n’est pas grave, chaque question est une occasion d’apprendre.'}
        </p>
      </Card>

      <Card>
        <h2 className="text-xl font-extrabold">{r.question?.question}</h2>
        <ul className="mt-4 space-y-2">
          {r.question?.answers.map((text, i) => {
            const isSelected = i === r.selectedAnswer;
            const isRight = i === r.correctAnswer;
            return (
              <li key={i} className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 font-bold ${isRight ? 'border-mint-600 bg-mint-50' : isSelected ? 'border-sun-500 bg-sun-100' : 'border-brand-100'}`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-extrabold ring-1 ring-black/10" aria-hidden="true">{LETTERS[i]}</span>
                <span className="flex-1">{text}</span>
                {isRight && <span className="flex items-center gap-1 text-sm text-mint-700"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Bonne réponse</span>}
                {isSelected && !isRight && <span className="flex items-center gap-1 text-sm text-amber-900"><XCircle className="h-5 w-5" aria-hidden="true" /> Ton choix</span>}
                {isSelected && isRight && <span className="sr-only">Ton choix</span>}
              </li>
            );
          })}
        </ul>
      </Card>

      {r.explanation && (
        <Card className="bg-brand-50">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-brand-700"><Lightbulb className="h-5 w-5" aria-hidden="true" /> Le savais-tu ?</h2>
          <p className="mt-2 text-lg">{r.explanation}</p>
        </Card>
      )}

      {progress.data && (
        <p className="text-center text-lg font-bold">Bonnes réponses jusqu’ici : {progress.data.correct} sur {progress.data.answered}. Continue tes efforts, tu progresses !</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button to="/progression">Voir ma progression</Button>
        <Button variant="secondary" to="/">Retour à l’accueil</Button>
      </div>
    </div>
  );
}
