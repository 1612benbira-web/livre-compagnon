import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { Field } from '../components/common/Field.jsx';
import { Alert } from '../components/common/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';
import { authService } from '../services/auth.js';
import { resetPasswordSchema } from '../utils/schemas.js';

const TOKEN = /^[0-9a-f]{64}$/;

// Page ouverte depuis le lien de l'email : /reinitialiser-mot-de-passe?token=…
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { setUser } = useAuth();
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await authService.resetPassword({ token, ...values });
      setUser(null); // le serveur a fermé toutes les sessions
      setDone(true);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  if (!TOKEN.test(token)) {
    return (
      <Card className="mx-auto max-w-md space-y-4 text-center" role="alert">
        <h1 className="text-2xl font-extrabold text-brand-700">Lien incomplet</h1>
        <p>Ce lien de réinitialisation n’est pas valide. Ouvre le lien reçu par email en entier, ou fais une nouvelle demande.</p>
        <Button to="/mot-de-passe-oublie" className="w-full">Nouvelle demande</Button>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-md space-y-4 text-center" role="status">
        <KeyRound className="mx-auto h-12 w-12 text-mint-700" aria-hidden="true" />
        <h1 className="text-2xl font-extrabold text-brand-700">Mot de passe changé !</h1>
        <p>Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
        <Button to="/connexion" className="w-full">Se connecter</Button>
      </Card>
    );
  }

  return (
    <Card as="form" onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-md space-y-4">
      <h1 className="text-3xl font-extrabold text-brand-700">Nouveau mot de passe</h1>
      {serverError && (
        <Alert>
          {serverError}{' '}
          <Link to="/mot-de-passe-oublie" className="underline">Nouvelle demande</Link>
        </Alert>
      )}
      <Field id="password" label="Nouveau mot de passe" type="password" autoComplete="new-password" hint="Au moins 8 caractères, avec une lettre et un chiffre." error={errors.password?.message} {...register('password')} />
      <Field id="confirmPassword" label="Confirme le mot de passe" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Enregistrement…' : 'Changer mon mot de passe'}</Button>
    </Card>
  );
}
