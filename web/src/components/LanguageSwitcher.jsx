import { useLanguage } from '../i18n/LanguageProvider';
import { Dropdown } from '../shared/ui';

export default function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage } = useLanguage();
  return (
    <label className={`inline-flex items-center ${className || 'relative'}`} title="Select language">
      <svg aria-hidden="true" className="pointer-events-none absolute left-2.5 h-4 w-4 text-text-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>
      <span className="sr-only">Language</span>
      <Dropdown aria-label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} className="h-9 py-1 pl-8 text-xs font-semibold shadow-sm">
        <option value="en">English</option><option value="hi">हिन्दी</option><option value="pa">ਪੰਜਾਬੀ</option>
      </Dropdown>
      <svg aria-hidden="true" className="pointer-events-none absolute right-2 h-3 w-3 text-text-subtle" viewBox="0 0 20 20" fill="currentColor"><path d="m5 7 5 5 5-5"/></svg>
    </label>
  );
}
