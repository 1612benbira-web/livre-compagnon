export default function ProgressBar({ value, label }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-5 w-full overflow-hidden rounded-full bg-brand-100"
      >
        <div className="h-full rounded-full bg-mint-600 transition-all duration-500" style={{ width: `${v}%` }} />
      </div>
      <p className="mt-1 text-right text-sm font-bold text-brand-700">{v} %</p>
    </div>
  );
}
