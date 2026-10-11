import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2 } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { Field } from '../components/common/Field.jsx';
import { Alert } from '../components/common/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';
import { authService } from '../services/auth.js';
import { passwordChangeSchema, profileSchema } from '../utils/schemas.js';

function ProfileForm() {
  const { user, setUser } = useAuth();
  const [msg, setMsg] = useState({ type: '', text: '' });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user.firstName },
  });
  const onSubmit = async (values) => {
    setMsg({ type: '', text: '' });
    try {
      const data = await authService.updateProfile(values);
      setUser(data.user);
      setMsg({ type: 'success', text: 'Profil mis à jour.' });
    } catch (err) {
      setMsg({ type: 'error', text: getErrorMessage(err) });
    }
  };
  return (
    <Card as="form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <h2 className="text-xl font-extrabold">Mes informations</h2>
      {msg.text && <Alert type={msg.type}>{msg.text}</Alert>}
      <Field id="firstName" label="Prénom" error={errors.firstName?.message} {...register('firstName')} />
      <Field id="email" label="Email" value={user.email} disabled readOnly hint="L’email ne peut pas être modifié ici." />
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enregistrement…' : 'Enregistrer'}</Button>
    </Card>
  );
}

function PasswordForm() {
  const [msg, setMsg] = useState({ type: '', text: '' });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(passwordChangeSchema) });
  const onSubmit = async (values) => {
    setMsg({ type: '', text: '' });
    try {
      await authService.changePassword(values);
      reset();
      setMsg({ type: 'success', text: 'Mot de passe modifié.' });
    } catch (err) {
      setMsg({ type: 'error', text: getErrorMessage(err) });
    }
  };
  return (
    <Card as="form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <h2 className="text-xl font-extrabold">Changer mon mot de passe</h2>
      {msg.text && <Alert type={msg.type}>{msg.text}</Alert>}
      <Field id="currentPassword" label="Mot de passe actuel" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
      <Field id="newPassword" label="Nouveau mot de passe" type="password" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
      <Field id="confirmNew" label="Confirmer le nouveau mot de passe" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Modification…' : 'Modifier le mot de passe'}</Button>
    </Card>
  );
}

function DeleteAccount() {
  const { setUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (isAdmin) return null; // un compte administrateur ne se supprime pas depuis l'interface lecteur

  const remove = async (e) => {
    e.preventDefault();
    if (!password) return setError('Entre ton mot de passe pour confirmer.');
    if (!window.confirm('Supprimer définitivement ton compte et toutes tes réponses ? Cette action est irréversible.')) return;
    setBusy(true);
    setError('');
    try {
      await authService.deleteAccount(password);
      setUser(null);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card as="form" onSubmit={remove} noValidate className="space-y-4 border-2 border-red-200">
      <h2 className="text-xl font-extrabold text-red-800">Supprimer mon compte</h2>
      <p>Ton compte et toutes tes réponses seront effacés définitivement.</p>
      {error && <Alert>{error}</Alert>}
      <Field id="deletePassword" label="Mot de passe" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button type="submit" variant="danger" disabled={busy}><Trash2 className="h-5 w-5" aria-hidden="true" /> {busy ? 'Suppression…' : 'Supprimer mon compte'}</Button>
    </Card>
  );
}

export default function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-extrabold text-brand-700">Mon profil</h1>
      <ProfileForm />
      <PasswordForm />
      <Button variant="secondary" onClick={async () => { await logout(); navigate('/'); }}><LogOut className="h-5 w-5" aria-hidden="true" /> Me déconnecter</Button>
      <DeleteAccount />
    </div>
  );
}
