import { Link } from 'react-router-dom';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

const features = [
  {
    title: 'Family tree',
    desc: 'Register members, set family heads, and keep your household connected in one place.',
    image:
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop',
  },
  {
    title: 'Village events',
    desc: 'Discover gatherings, festivals, and meetings happening in your community.',
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop',
  },
  {
    title: 'Instant news',
    desc: 'Share photos, videos, voice notes, and updates with everyone in the village.',
    image:
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop',
  },
  {
    title: 'Map & alerts',
    desc: 'See village locations on the map and receive important notifications instantly.',
    image:
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&h=400&fit=crop',
  },
];

const appHighlights = [
  'Events, news & map on the go',
  'Push notifications for alerts',
  'Lightweight and easy to use',
  'Same account as the website',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-app">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-muted via-surface to-soft" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block rounded-full bg-primary-soft text-primary-text text-xs font-semibold px-3 py-1 mb-4">
                Welcome to MY VILLAGE
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-text leading-tight">
                Your village, connected in one place
              </h1>
              <p className="mt-5 text-lg text-text-muted leading-relaxed">
                MY VILLAGE helps communities stay informed — manage families, share news, plan events,
                send invitations, and receive alerts on web and mobile.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast px-6 py-3 font-medium shadow-md transition"
                >
                  Get started free
                </Link>
                <Link
                  to="/login"
                  className="rounded-lg border border-line px-6 py-3 font-medium text-text hover:bg-surface transition"
                >
                  Log in
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-line">
                <img
                  src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop"
                  alt="Village community"
                  className="w-full h-72 sm:h-96 object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-xl bg-card shadow-lg border border-line p-4 hidden sm:block">
                <p className="text-sm font-semibold text-text">Community first</p>
                <p className="text-xs text-text-subtle mt-1">Events · News · Family · Map</p>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-16 lg:py-20 bg-surface">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold text-text">About MY VILLAGE</h2>
            <p className="mt-4 max-w-2xl mx-auto text-text-muted leading-relaxed">
              Whether you are a villager keeping up with local news or an admin managing the
              community, MY VILLAGE gives you the tools to stay connected. Role-based access ensures
              admins can oversee users and content while members enjoy a simple, friendly experience.
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 lg:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text">
                Everything your village needs
              </h2>
              <p className="mt-3 text-text-muted">
                Powerful features for everyday community life
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
              {features.map((f) => (
                <article
                  key={f.title}
                  className="rounded-2xl overflow-hidden border border-line bg-card shadow-sm hover:shadow-md transition"
                >
                  <img src={f.image} alt={f.title} className="w-full h-48 object-cover" />
                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-text">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm text-text-muted">{f.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile App */}
        <section id="app" className="py-16 lg:py-20 bg-surface">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <span className="text-primary font-semibold text-sm">MY VILLAGE App</span>
              <h2 className="mt-2 text-3xl font-bold text-text">
                Take your village with you
              </h2>
              <p className="mt-4 text-text-muted leading-relaxed">
                The MY VILLAGE mobile app mirrors the website experience — browse events, read news,
                view the village map, and get push notifications wherever you are.
              </p>
              <ul className="mt-6 space-y-3">
                {appHighlights.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-text-muted">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary text-xs font-bold">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="inline-block mt-8 rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast px-6 py-3 font-medium transition"
              >
                Join MY VILLAGE
              </Link>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative">
                <div className="w-64 sm:w-72 rounded-[2.5rem] border-8 border-elevated bg-elevated shadow-2xl overflow-hidden">
                  <div className="bg-primary text-primary-contrast text-center py-3 text-sm font-bold">
                    MY VILLAGE
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=700&fit=crop"
                    alt="MY VILLAGE mobile app preview"
                    className="w-full h-80 object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-primary to-primary-hover">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-contrast">
              Ready to connect with your village?
            </h2>
            <p className="mt-3 text-primary-contrast/80 max-w-xl mx-auto">
              Create your account today and start exploring events, news, and your community.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="rounded-lg bg-surface text-primary hover:bg-soft px-6 py-3 font-medium transition"
              >
                Sign up now
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-primary-contrast/40 text-primary-contrast hover:bg-primary-contrast/10 px-6 py-3 font-medium transition"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
