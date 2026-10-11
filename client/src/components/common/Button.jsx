import { Link } from 'react-router-dom';

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  accent: 'bg-sun-400 text-ink hover:bg-sun-500 shadow-sm',
  secondary: 'bg-white text-brand-700 border-2 border-brand-100 hover:border-brand-500',
  danger: 'bg-red-700 text-white hover:bg-red-800',
  ghost: 'text-brand-700 hover:bg-brand-50',
};

export default function Button({ variant = 'primary', to, className = '', children, type = 'button', ...props }) {
  const cls = `inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 py-3 text-base font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} {...props}>
      {children}
    </button>
  );
}
