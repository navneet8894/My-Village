const variants = {
  default: 'bg-soft text-text-muted', primary: 'bg-primary-soft text-primary-text',
  danger: 'bg-danger-soft text-danger-text', warning: 'bg-warning-soft text-warning-text',
};
export default function Badge({ variant = 'default', className = '', ...props }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`} {...props} />;
}
