import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, UserPlus } from 'lucide-react';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import { Alert } from '../common/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage, getStatus } from '../../services/api.js';
import { answerService } from '../../services/content.js';
import { LETTERS } from '../../utils/format.js';

// Carte d'une question (choix unique) : sélection, validation, invitation à créer un compte.
// Utilisée par « Question du jour » et par « Toutes les questions ».
export default function QuestionCard({ question, alreadyAnswered, answerId, onConflict }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [needAccount, setNeedAccount] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (selected === null) {
      setSubmitError('Choisis une réponse avant de valider.');
      return;
    }
    if (!user) {
      setNeedAccount(true); // invitation à s'inscrire au moment opportun
      return;
    }
    setSubmitting(true);
    try {
      const { result } = await answerService.submit(question.id, selected);
      navigate(`/resultat/${result.id}`);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      if (getStatus(err) === 409) onConflict?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card as="form" onSubmit={submit} noValidate className="pop-in">
        {alreadyAnswered && (
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-mint-100 px-3 py-1 font-extrabold text-mint-700">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Déjà répondue
          </p>
        )}
        <fieldset disabled={alreadyAnswered || submitting}>
          <legend className="mb-4 text-2xl font-extrabold leading-snug">{question.question}</legend>
          <div className="space-y-3">
            {question.answers.map((text, i) => (
              <label key={i} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-lg font-bold transition has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:disabled]:cursor-default ${selected === i ? 'border-brand-600' : 'border-brand-100 hover:border-brand-500'}`}>
                <input type="radio" name="answer" value={i} checked={selected === i} onChange={() => { setSelected(i); setSubmitError(''); }} className="h-5 w-5 accent-brand-600" />
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sun-100 font-extrabold" aria-hidden="true">{LETTERS[i]}</span>
                <span>{text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {submitError && <div className="mt-4"><Alert>{submitError}</Alert></div>}

        {alreadyAnswered ? (
          <Button variant="primary" to={`/resultat/${answerId}`} className="mt-6 w-full">Voir mon résultat</Button>
        ) : (
          <Button type="submit" variant="accent" disabled={submitting} className="mt-6 w-full text-lg">
            {submitting ? 'Envoi…' : 'Valider ma réponse'}
          </Button>
        )}
      </Card>

      {needAccount && !user && (
        <Card className="pop-in border-2 border-sun-400 text-center" role="dialog" aria-label="Créer un compte">
          <UserPlus className="mx-auto h-10 w-10 text-brand-600" aria-hidden="true" />
          <h2 className="mt-2 text-xl font-extrabold">Pour enregistrer ta réponse, il te faut un compte</h2>
          <p className="mt-1">C’est gratuit et rapide. Ta progression sera sauvegardée.</p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="accent" to="/inscription" state={{ from: pathname }}>Créer un compte</Button>
            <Button variant="secondary" to="/connexion" state={{ from: pathname }}>J’ai déjà un compte</Button>
          </div>
        </Card>
      )}
    </>
  );
}
