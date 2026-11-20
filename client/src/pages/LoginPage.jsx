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
import { loginSchema } from '../utils/schemas.js';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from || '/espace';
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <Card as="form" onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-md space-y-4">
      <h1 className="text-3xl font-extrabold text-brand-700">Connexion</h1>
      {serverError && <Alert>{serverError}</Alert>}
      <Field id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Field id="password" label="Mot de passe" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
      <p className="-mt-2 text-right text-sm">
        <Link to="/mot-de-passe-oublie" className="font-bold text-brand-700 underline">Mot de passe oublié ?</Link>
      </p>
      <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Connexion…' : 'Se connecter'}</Button>
      <p className="text-center">Pas encore de compte ? <Link to="/inscription" state={{ from }} className="font-extrabold text-brand-700 underline">Créer un compte</Link></p>
    </Card>
  );
}
