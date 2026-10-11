export default function Card({ className = '', children, as: Tag = 'div', ...props }) {
  return (
    <Tag className={`rounded-3xl bg-white p-5 shadow-md ring-1 ring-black/5 sm:p-7 ${className}`} {...props}>
      {children}
    </Tag>
  );
}
