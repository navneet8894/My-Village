export default function Card({ as: Component = 'div', className = '', interactive = false, ...props }) {
  return <Component className={`rounded-xl border border-line bg-card ${interactive ? 'transition hover:border-primary hover:shadow-md' : ''} ${className}`} {...props} />;
}
