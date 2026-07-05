import { Link } from 'react-router-dom';

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
            MV
          </span>
          <span className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-brand-600 transition">
            MY VILLAGE
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="#about" className="hover:text-brand-600 transition">
            About
          </a>
          <a href="#features" className="hover:text-brand-600 transition">
            Features
          </a>
          <a href="#app" className="hover:text-brand-600 transition">
            Mobile App
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-medium transition shadow-sm"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
