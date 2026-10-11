import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const linkClass = ({ isActive }) =>
  `rounded-xl px-3 py-2 font-extrabold ${isActive ? 'bg-brand-100 text-brand-700' : 'text-ink hover:bg-brand-50'}`;

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const handleLogout = async () => {
    close();
    await logout();
    navigate('/');
  };

  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={close}>Accueil</NavLink>
      <NavLink to="/question-du-jour" className={linkClass} onClick={close}>Question du jour</NavLink>
      {user ? (
        <>
          <NavLink to="/progression" className={linkClass} onClick={close}>Progression</NavLink>
          <NavLink to="/espace" className={linkClass} onClick={close}>Mon espace</NavLink>
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left font-extrabold text-ink hover:bg-brand-50">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Déconnexion
          </button>
        </>
      ) : (
        <>
          <NavLink to="/connexion" className={linkClass} onClick={close}>Se connecter</NavLink>
          <Link to="/inscription" onClick={close} className="rounded-xl bg-sun-400 px-4 py-2 text-center font-extrabold hover:bg-sun-500">Créer un compte</Link>
        </>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-xl focus:bg-white focus:p-3">
        Aller au contenu
      </a>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-brand-700">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </span>
            Mon livre
          </Link>
          <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">{links}</nav>
          <button
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-brand-700 hover:bg-brand-50 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav id="menu-mobile" aria-label="Navigation principale" className="flex flex-col gap-1 border-t border-black/5 px-4 pb-4 pt-2 md:hidden">
            {links}
          </nav>
        )}
      </header>
      <main id="contenu" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-black/5 py-6 text-center text-sm text-ink/70">
        <Link to="/confidentialite" className="font-bold underline">Politique de confidentialité</Link>
        <span className="mx-2">·</span>
        <Link to="/admin/connexion" className="underline">Administration</Link>
      </footer>
    </div>
  );
}
