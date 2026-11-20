import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { Field } from '../components/common/Field.jsx';
import { Alert } from '../components/common/Feedback.jsx';
import { getErrorMessage } from '../services/api.js';
import { authService } from '../services/auth.js';
import { forgotPasswordSchema } from '../utils/schemas.js';

// Demande de réinitialisation : la réponse est la même que l'adresse corresponde à un compte ou non
export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState('');
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async ({ email }) => {
    setServerError('');
    try {
      await authService.forgotPassword(email);
      setSentTo(email);
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  if (sentTo) {
    return (
      <Card className="mx-auto max-w-md space-y-4 text-center" role="status">
        <MailCheck className="mx-auto h-12 w-12 text-brand-600" aria-hidden="true" />
        <h1 className="text-2xl font-extrabold text-brand-700">Regarde ta boîte mail</h1>
        <p>
          Si un compte existe avec l’adresse <strong className="break-all">{sentTo}</strong>, tu vas recevoir un email avec un lien
          pour choisir un nouveau mot de passe. Le lien est valable 30 minutes.
        </p>
        <p className="text-sm text-ink/70">Pense à regarder aussi dans les courriers indésirables (spam). Tu peux demander à un adulte de t’aider.</p>
        <Button variant="secondary" to="/connexion" className="w-full">Retour à la connexion</Button>
      </Card>
    );
  }

  return (
    <Card as="form" onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-md space-y-4">
      <h1 className="text-3xl font-extrabold text-brand-700">Mot de passe oublié</h1>
      <p>Indique l’adresse email de ton compte : nous t’enverrons un lien pour choisir un nouveau mot de passe.</p>
      {serverError && <Alert>{serverError}</Alert>}
      <Field id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Envoi…' : 'Recevoir le lien'}</Button>
      <p className="text-center">
        <Link to="/connexion" className="font-extrabold text-brand-700 underline">Retour à la connexion</Link>
      </p>
    </Card>
  );
}
