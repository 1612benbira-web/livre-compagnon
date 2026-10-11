import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { Field } from '../components/common/Field.jsx';
import { Alert } from '../components/common/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';
import { registerSchema } from '../utils/schemas.js';

export default function RegisterPage() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from || '/espace';
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });

  const onSubmit = async ({ firstName, email, password, confirmPassword }) => {
    setServerError('');
    try {
      await signUp({ firstName, email, password, confirmPassword });
      navigate(from, { replace: true });
    } catch (err) {
      const fieldMsg = err?.response?.data?.errors?.[0]?.message;
      setServerError(fieldMsg || getErrorMessage(err));
    }
  };

  return (
    <Card as="form" onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-md space-y-4">
      <h1 className="text-3xl font-extrabold text-brand-700">Créer un compte</h1>
      <p>Pour garder ta progression. Nous ne demandons que le nécessaire.</p>
      {serverError && <Alert>{serverError}</Alert>}
      <Field id="firstName" label="Prénom" autoComplete="given-name" error={errors.firstName?.message} {...register('firstName')} />
      <Field id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Field id="password" label="Mot de passe" type="password" autoComplete="new-password" hint="8 caractères minimum, avec une lettre et un chiffre." error={errors.password?.message} {...register('password')} />
      <Field id="confirmPassword" label="Confirmer le mot de passe" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      <div>
        <label className="flex items-start gap-3 font-semibold">
          <input type="checkbox" className="mt-1 h-5 w-5 accent-brand-600" {...register('acceptTerms')} />
          <span>J’ai lu la <Link to="/confidentialite" className="font-extrabold text-brand-700 underline">politique de confidentialité</Link> et je crée mon compte. (Si tu es un enfant, fais-le avec un parent.)</span>
        </label>
        {errors.acceptTerms && <p role="alert" className="mt-1 text-sm font-bold text-red-700">{errors.acceptTerms.message}</p>}
      </div>
      <Button type="submit" variant="accent" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Création…' : 'Créer mon compte'}</Button>
      <p className="text-center">Déjà inscrit ? <Link to="/connexion" state={{ from }} className="font-extrabold text-brand-700 underline">Se connecter</Link></p>
    </Card>
  );
}
