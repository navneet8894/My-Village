import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../features/theme/themeSlice';

export default function ThemeToggle({ compact = false, className = '' }) {
  const dispatch = useDispatch();
  const dark = useSelector((s) => s.theme.dark);

  return (
    <button
      type="button"
      onClick={() => dispatch(toggleTheme())}
      className={`inline-flex items-center justify-center rounded-lg border border-line bg-surface text-text-muted transition hover:bg-soft hover:text-text ${
        compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm font-medium'
      } ${className}`}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  );
}
