export default function StatCard({ icon: Icon, label, value, tone = 'brand' }) {
  const tones = { brand: 'bg-brand-50 text-brand-700', mint: 'bg-mint-50 text-mint-700', sun: 'bg-sun-100 text-amber-900' };
  return (
    <div className="rounded-3xl bg-white p-5 shadow-md ring-1 ring-black/5">
      <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="font-semibold text-ink/70">{label}</p>
    </div>
  );
}
