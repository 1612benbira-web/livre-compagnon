import { forwardRef } from 'react';

export const inputClass =
  'w-full min-h-12 rounded-2xl border-2 border-brand-100 bg-white px-4 py-2.5 text-base font-semibold placeholder:font-normal placeholder:text-ink/50 focus:border-brand-500 disabled:bg-brand-50 disabled:text-ink/60';

// Champ de formulaire accessible (label + erreur liée)
export const Field = forwardRef(function Field({ label, error, hint, id, as: Tag = 'input', children, ...props }, ref) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-extrabold">
        {label}
      </label>
      <Tag id={id} ref={ref} aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? `${id}-error` : undefined} className={inputClass} {...props}>
        {children}
      </Tag>
      {hint && !error && <p className="mt-1 text-sm text-ink/70">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-bold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
});
