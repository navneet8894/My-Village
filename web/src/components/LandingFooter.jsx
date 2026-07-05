import { Link } from 'react-router-dom';

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
                MV
              </span>
              <span className="font-bold text-lg text-white">MY VILLAGE</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connecting villagers through events, news, family trees, and community alerts — on web
              and mobile.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="hover:text-brand-400 transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#app" className="hover:text-brand-400 transition">
                  Mobile App
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-400 transition">
                  Log in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>Events & gatherings</li>
              <li>Village news & media</li>
              <li>Family & invitations</li>
              <li>Map & notifications</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Get started</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/register" className="hover:text-brand-400 transition">
                  Create account
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-400 transition">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} MY VILLAGE. All rights reserved.</p>
          <p>Built for stronger village communities.</p>
        </div>
      </div>
    </footer>
  );
}
