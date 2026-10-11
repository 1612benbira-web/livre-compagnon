import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import { Alert, ErrorMessage, Spinner } from '../../components/common/Feedback.jsx';
import { Field } from '../../components/common/Field.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { adminService } from '../../services/admin.js';
import { getErrorMessage } from '../../services/api.js';
import { LETTERS, STATUS_LABELS, toDateInput } from '../../utils/format.js';
import { questionFormSchema } from '../../utils/schemas.js';

const lockedSchema = questionFormSchema.pick({ question: true, explanation: true, status: true, publicationDate: true });

function QuestionForm({ books, question }) {
  const navigate = useNavigate();
  const editing = Boolean(question);
  // Une question déjà répondue garde ses propositions et sa bonne réponse (cohérence de l'historique)
  const locked = editing && question.answerCount > 0;
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(locked ? lockedSchema : questionFormSchema),
    defaultValues: editing
      ? {
          book: question.book, question: question.question, answers: question.answers,
          correctAnswer: String(question.correctAnswer), explanation: question.explanation ?? '',
          status: question.status, publicationDate: toDateInput(question.publicationDate),
        }
      : { book: books[0]?._id ?? '', question: '', answers: ['', '', '', ''], correctAnswer: '0', explanation: '', status: 'draft', publicationDate: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    const payload = {
      question: values.question, explanation: values.explanation, status: values.status,
      publicationDate: values.publicationDate || null,
    };
    if (!locked) Object.assign(payload, { book: values.book, answers: values.answers, correctAnswer: Number(values.correctAnswer) });
    try {
      if (editing) await adminService.updateQuestion(question._id, payload);
      else await adminService.createQuestion(payload);
      navigate('/admin/questions');
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <Card as="form" onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl space-y-5">
      {locked && <Alert type="success">Cette question a déjà {question.answerCount} réponse(s) : ses propositions, sa bonne réponse et son livre ne peuvent plus être modifiés. Pour la remplacer, archive-la et crée une nouvelle question.</Alert>}
      {serverError && <Alert>{serverError}</Alert>}

      <Field id="book" as="select" label="Livre" disabled={locked} error={errors.book?.message} {...register('book')}>
        {books.map((b) => <option key={b._id} value={b._id}>{b.title}</option>)}
      </Field>
      <Field id="question" as="textarea" rows={3} label="Question" error={errors.question?.message} {...register('question')} />

      <fieldset disabled={locked} className="space-y-3">
        <legend className="mb-1 font-extrabold">Propositions (coche la bonne réponse)</legend>
        {LETTERS.map((letter, i) => (
          <div key={letter} className="flex items-start gap-3">
            <input type="radio" value={String(i)} aria-label={`Bonne réponse : ${letter}`} className="mt-4 h-5 w-5 accent-mint-600" {...register('correctAnswer')} />
            <div className="flex-1">
              <Field id={`answer-${i}`} label={`Réponse ${letter}`} error={errors.answers?.[i]?.message} {...register(`answers.${i}`)} />
            </div>
          </div>
        ))}
      </fieldset>

      <Field id="explanation" as="textarea" rows={3} label="Explication (affichée après la réponse)" error={errors.explanation?.message} {...register('explanation')} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="status" as="select" label="Statut" error={errors.status?.message} {...register('status')}>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Field>
        <Field id="publicationDate" type="date" label="Date de publication" hint="Vide = aujourd’hui si la question est publiée." error={errors.publicationDate?.message} {...register('publicationDate')} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="accent" disabled={isSubmitting}>{isSubmitting ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer la question'}</Button>
        <Button variant="secondary" to="/admin/questions">Annuler</Button>
      </div>
    </Card>
  );
}

export default function AdminQuestionForm() {
  const { id } = useParams();
  const books = useFetch(() => adminService.books(), []);
  const existing = useFetch(() => (id ? adminService.question(id) : Promise.resolve(null)), [id]);

  if (books.loading || existing.loading) return <Spinner />;
  if (books.error) return <ErrorMessage message={books.error} onRetry={books.reload} />;
  if (existing.error) return <ErrorMessage message={existing.error} onRetry={existing.reload} />;
  if (!books.data.books.length) return <Alert>Crée d’abord un livre (script de seed ou API) avant d’ajouter des questions.</Alert>;

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold text-brand-700">{id ? 'Modifier la question' : 'Nouvelle question'}</h1>
      <QuestionForm books={books.data.books} question={existing.data?.question ?? null} />
    </div>
  );
}
