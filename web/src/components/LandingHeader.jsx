import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-contrast font-bold text-sm">
            MV
          </span>
          <span className="font-bold text-lg text-text group-hover:text-primary transition">
            MY VILLAGE
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
          <a href="#about" className="hover:text-primary transition">
            About
          </a>
          <a href="#features" className="hover:text-primary transition">
            Features
          </a>
          <a href="#app" className="hover:text-primary transition">
            Mobile App
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle compact className="hidden sm:inline-flex" />
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-text-muted hover:bg-soft hover:text-text transition"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast px-4 py-2 text-sm font-medium transition shadow-sm"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
