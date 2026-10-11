import { useState } from 'react';
import Card from '../../components/common/Card.jsx';
import { EmptyState, ErrorMessage, Spinner } from '../../components/common/Feedback.jsx';
import { Field } from '../../components/common/Field.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { adminService } from '../../services/admin.js';
import { formatDate } from '../../utils/format.js';

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useFetch(() => adminService.users({ page, limit: 10, search }), [page, search]);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold text-brand-700">Utilisateurs</h1>
      <div className="max-w-xs">
        <Field id="search" type="search" label="Rechercher (prénom ou email)" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      {loading ? <Spinner /> : error ? <ErrorMessage message={error} onRetry={reload} /> : !data.users.length ? (
        <EmptyState title="Aucun utilisateur" text="Aucun compte ne correspond." />
      ) : (
        <>
          <Card className="overflow-x-auto !p-0">
            <table className="w-full min-w-[36rem] text-left">
              <thead className="bg-brand-50 text-brand-700"><tr><th className="p-3">Prénom</th><th className="p-3">Email</th><th className="p-3">Inscription</th><th className="p-3">Réponses</th><th className="p-3">Réussite</th></tr></thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="border-t border-black/5">
                    <td className="p-3 font-bold">{u.firstName}{u.role === 'admin' && <span className="ml-2 rounded-full bg-sun-100 px-2 py-0.5 text-xs font-extrabold">admin</span>}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="p-3">{u.answered}</td>
                    <td className="p-3">{u.answered ? `${u.successRate} %` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination pagination={data.pagination} onChange={setPage} />
        </>
      )}
    </div>
  );
}
