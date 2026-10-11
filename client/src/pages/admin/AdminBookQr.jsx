import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Check, Copy, Download, ExternalLink } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import { Alert, ErrorMessage, Spinner } from '../../components/common/Feedback.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { adminService } from '../../services/admin.js';
import { getErrorMessage } from '../../services/api.js';

export default function AdminBookQr() {
  const { id } = useParams();
  const { created, coverError } = useLocation().state ?? {};
  const book = useFetch(() => adminService.book(id), [id]);
  const qr = useFetch(() => adminService.bookQr(id), [id]);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState({ type: '', text: '' });

  if (book.loading || qr.loading) return <Spinner label="Génération du QR code…" />;
  if (book.error) return <ErrorMessage message={book.error} onRetry={book.reload} />;
  if (qr.error) return <ErrorMessage message={qr.error} onRetry={qr.reload} />;

  const { title, slug } = book.data.book;
  const { url, https, published, svg } = qr.data;
  // Image via data URI : le SVG n'est jamais injecté dans la page (pas d'exécution de script possible)
  const preview = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  const download = async (format) => {
    setBusy(format);
    setNote({ type: '', text: '' });
    try {
      const res = await adminService.downloadQr(id, format);
      const href = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = href;
      a.download = `qr-${slug}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      setNote({ type: 'error', text: getErrorMessage(err, 'Téléchargement impossible.') });
    } finally {
      setBusy('');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setNote({ type: 'success', text: 'Lien copié.' });
    } catch {
      setNote({ type: 'error', text: 'Copie impossible : sélectionne le lien et copie-le à la main.' });
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-3xl font-extrabold text-brand-700">QR code du livre</h1>
      {created && <Alert type="success">Livre créé : son QR code a été généré automatiquement.</Alert>}
      {coverError && <Alert>Le livre est créé, mais l’image n’a pas pu être envoyée : {coverError} Tu peux la réessayer en modifiant le livre.</Alert>}
      {!https && <Alert>Ce QR code pointe vers une adresse non HTTPS ({url}). Il convient pour tester en local, mais ne l’imprime pas : configure l’adresse publique (CLIENT_URL ou PUBLIC_BASE_URL) sur le serveur.</Alert>}
      {!published && <Alert>Ce livre n’est pas publié : le QR code mènera à une page introuvable tant qu’il ne l’est pas.</Alert>}
      {note.text && <Alert type={note.type}>{note.text}</Alert>}

      <Card className="grid items-center gap-6 sm:grid-cols-[14rem_1fr]">
        <img src={preview} alt={`QR code du livre ${title}`} className="mx-auto h-56 w-56 rounded-2xl bg-white ring-1 ring-black/10" />
        <div className="space-y-3">
          <p className="text-xl font-extrabold">{title}</p>
          <p className="break-all rounded-2xl bg-brand-50 p-3 font-mono text-sm">{url}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="accent" onClick={() => download('svg')} disabled={busy === 'svg'}><Download className="h-5 w-5" aria-hidden="true" /> SVG (imprimeur)</Button>
            <Button variant="primary" onClick={() => download('png')} disabled={busy === 'png'}><Download className="h-5 w-5" aria-hidden="true" /> PNG</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={copy}><Copy className="h-5 w-5" aria-hidden="true" /> Copier le lien</Button>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-2xl px-4 font-extrabold text-brand-700 hover:bg-brand-50"><ExternalLink className="h-5 w-5" aria-hidden="true" /> Ouvrir la page</a>
          </div>
        </div>
      </Card>

      <Card className="bg-sun-100">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><Check className="h-5 w-5" aria-hidden="true" /> Avant d’imprimer</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Le QR code est calculé à partir du slug <strong>{slug}</strong> : tant que le slug et le domaine ne changent pas, le code reste identique.</li>
          <li>Donne le fichier <strong>SVG</strong> à l’imprimeur (net à toute taille). Taille minimale conseillée : 2 à 3 cm, noir sur fond clair, marge blanche conservée.</li>
          <li>Scanne une épreuve imprimée avec un iPhone et un Android avant le tirage.</li>
        </ul>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" to="/admin/livres">Retour aux livres</Button>
        <Link to="/admin/questions/nouvelle" className="inline-flex min-h-12 items-center px-3 font-extrabold text-brand-700 underline">Ajouter des questions</Link>
      </div>
    </div>
  );
}
