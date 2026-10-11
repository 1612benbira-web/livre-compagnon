import { BookOpen, HelpCircle, LayoutDashboard, ListChecks, LogOut, Users } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const items = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/livres', label: 'Livres', icon: BookOpen },
  { to: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { to: '/admin/reponses', label: 'Réponses', icon: ListChecks },
];

const itemClass = ({ isActive }) =>
  `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 font-extrabold ${isActive ? 'bg-brand-600 text-white' : 'text-ink hover:bg-brand-50'}`;

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const out = async () => { await logout(); navigate('/admin/connexion'); };

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-black/5 bg-white md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-3 md:block md:py-6">
          <p className="text-lg font-extrabold text-brand-700">Administration</p>
          <p className="hidden text-sm text-ink/70 md:block">Connecté : {user?.firstName}</p>
          <button onClick={out} className="flex items-center gap-1 font-extrabold text-brand-700 md:hidden"><LogOut className="h-4 w-4" aria-hidden="true" /> Quitter</button>
        </div>
        <nav aria-label="Administration" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={itemClass}>
              <Icon className="h-5 w-5" aria-hidden="true" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden space-y-1 px-3 py-6 md:block">
          <Link to="/" className="block rounded-xl px-3 py-2 font-bold text-brand-700 hover:bg-brand-50">Voir le site</Link>
          <button onClick={out} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-bold text-brand-700 hover:bg-brand-50"><LogOut className="h-4 w-4" aria-hidden="true" /> Déconnexion</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8"><Outlet /></main>
    </div>
  );
}
