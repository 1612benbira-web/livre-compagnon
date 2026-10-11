import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import { Field } from '../../components/common/Field.jsx';
import { Alert } from '../../components/common/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage } from '../../services/api.js';
import { loginSchema } from '../../utils/schemas.js';

export default function AdminLoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const user = await login(values);
      if (user.role !== 'admin') {
        await logout();
        setServerError('Ce compte n’a pas accès à l’administration.');
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card as="form" onSubmit={handleSubmit(onSubmit)} noValidate className="w-full space-y-4">
        <h1 className="text-3xl font-extrabold text-brand-700">Administration</h1>
        {serverError && <Alert>{serverError}</Alert>}
        <Field id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Field id="password" label="Mot de passe" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Connexion…' : 'Se connecter'}</Button>
      </Card>
    </div>
  );
}
