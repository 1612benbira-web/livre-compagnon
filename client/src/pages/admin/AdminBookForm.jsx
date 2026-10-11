import { useEffect, useRef, useState } from 'react';
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
import { ACCEPT, coverSrc, prepareCover } from '../../utils/cover.js';
import { bookFormSchema } from '../../utils/schemas.js';
import { slugify } from '../../utils/slugify.js';

export function BookForm({ book }) {
  const navigate = useNavigate();
  const editing = Boolean(book);
  const [serverError, setServerError] = useState('');
  // Tant que l'admin n'a pas modifié le slug à la main, il suit le titre (création uniquement)
  const slugTouched = useRef(editing);

  // Image de couverture : fichier choisi (déjà redimensionné), aperçu, ou retrait de l'image existante
  const [coverBlob, setCoverBlob] = useState(null);
  const [preview, setPreview] = useState('');
  const [removeCover, setRemoveCover] = useState(false);
  const [coverError, setCoverError] = useState('');
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const existingCover = editing && book.coverUploadedAt && !removeCover ? coverSrc(book) : '';
  const shownCover = preview || existingCover;

  const onPickCover = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-choisir le même fichier
    if (!file) return;
    setCoverError('');
    try {
      const blob = await prepareCover(file);
      setCoverBlob(blob);
      setPreview(URL.createObjectURL(blob));
      setRemoveCover(false);
    } catch (err) {
      setCoverError(err.message);
    }
  };
  const onRemoveCover = () => {
    setCoverBlob(null);
    setPreview('');
    if (editing && book.coverUploadedAt) setRemoveCover(true);
  };

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(bookFormSchema),
    defaultValues: editing
      ? { title: book.title, slug: book.slug, description: book.description ?? '', author: book.author ?? '', coverImage: book.coverImage ?? '', isPublished: book.isPublished }
      : { title: '', slug: '', description: '', author: '', coverImage: '', isPublished: true },
  });

  const titleField = register('title', {
    onChange: (e) => {
      if (!slugTouched.current) setValue('slug', slugify(e.target.value), { shouldValidate: true });
    },
  });
  const slugField = register('slug', { onChange: () => { slugTouched.current = true; } });

  const onSubmit = async (values) => {
    setServerError('');
    if (editing && values.slug !== book.slug &&
      !window.confirm('Changer le slug change l’adresse du livre : les QR codes déjà imprimés cesseront de fonctionner. Continuer ?')) return;
    try {
      if (editing) {
        await adminService.updateBook(book._id, values);
        try {
          if (coverBlob) await adminService.uploadCover(book._id, coverBlob);
          else if (removeCover) await adminService.deleteCover(book._id);
        } catch (err) {
          setServerError(`Livre enregistré, mais l’image n’a pas pu être mise à jour : ${getErrorMessage(err)}`);
          return;
        }
        navigate('/admin/livres');
      } else {
        const { book: created } = await adminService.createBook(values);
        let coverFailure = '';
        if (coverBlob) {
          try {
            await adminService.uploadCover(created._id, coverBlob);
          } catch (err) {
            coverFailure = getErrorMessage(err);
          }
        }
        // Le QR code est généré automatiquement : on l'affiche tout de suite
        navigate(`/admin/livres/${created._id}/qr`, { state: { created: true, coverError: coverFailure } });
      }
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <Card as="form" onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl space-y-5">
      {serverError && <Alert>{serverError}</Alert>}
      <Field id="title" label="Titre du livre" error={errors.title?.message} {...titleField} />
      <Field id="slug" label="Slug (adresse du livre)" hint="Définit l’adresse /livre/… encodée dans le QR code. Choisis-le avec soin : il ne doit plus changer après impression." error={errors.slug?.message} {...slugField} />
      <Field id="author" label="Auteur (facultatif)" error={errors.author?.message} {...register('author')} />
      <Field id="description" as="textarea" rows={4} label="Description" error={errors.description?.message} {...register('description')} />
      <div>
        <label htmlFor="cover" className="mb-1 block font-extrabold">Image de couverture (facultatif)</label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-44 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 text-center text-sm text-ink/60 ring-1 ring-black/10">
            {shownCover
              ? <img src={shownCover} alt="Aperçu de la couverture" className="h-full w-full object-cover" />
              : <span className="px-2">Aucune image importée</span>}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input id="cover" type="file" accept={ACCEPT} onChange={onPickCover} aria-describedby="cover-hint"
              className="block w-full text-sm file:mr-4 file:min-h-11 file:cursor-pointer file:rounded-xl file:border-0 file:bg-brand-100 file:px-4 file:py-2 file:font-extrabold file:text-brand-700 hover:file:bg-brand-500 hover:file:text-white" />
            <p id="cover-hint" className="text-sm text-ink/70">PNG, JPEG ou WebP. L’image est réduite automatiquement (1200 px maximum). Format portrait conseillé (3:4).</p>
            {coverError && <p role="alert" className="text-sm font-bold text-red-700">{coverError}</p>}
            {(shownCover || (editing && book.coverUploadedAt && !removeCover)) && (
              <button type="button" onClick={onRemoveCover} className="font-extrabold text-red-800 underline">Retirer l’image</button>
            )}
            {removeCover && <p className="text-sm font-bold text-amber-900">L’image importée sera supprimée à l’enregistrement.</p>}
          </div>
        </div>
      </div>
      <Field id="coverImage" label="Ou adresse d’une image (facultatif)" hint="Utilisée seulement si aucune image n’est importée. Ex. /images/couverture.jpg ou une URL https." error={errors.coverImage?.message} {...register('coverImage')} />
      <label className="flex items-start gap-3 font-semibold">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-brand-600" {...register('isPublished')} />
        <span>Publié (visible par les lecteurs ; nécessaire pour que le QR code fonctionne)</span>
      </label>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="accent" disabled={isSubmitting}>{isSubmitting ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer le livre et son QR code'}</Button>
        <Button variant="secondary" to="/admin/livres">Annuler</Button>
      </div>
    </Card>
  );
}

export default function AdminBookForm() {
  const { id } = useParams();
  const existing = useFetch(() => (id ? adminService.book(id) : Promise.resolve(null)), [id]);
  if (existing.loading) return <Spinner />;
  if (existing.error) return <ErrorMessage message={existing.error} onRetry={existing.reload} />;
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold text-brand-700">{id ? 'Modifier le livre' : 'Nouveau livre'}</h1>
      <BookForm book={existing.data?.book ?? null} />
    </div>
  );
}
