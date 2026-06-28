'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Sparkles, DollarSign, Hotel, MessageCircle, Calendar, CloudSun } from 'lucide-react';

const features = [
  { icon: Sparkles, title: 'AI Itinerary Generator', desc: 'Get a personalized day-by-day travel plan in seconds.' },
  { icon: DollarSign, title: 'Budget Estimation', desc: 'Know your estimated costs before you book.' },
  { icon: Hotel, title: 'Hotel Suggestions', desc: 'Curated hotel picks across all budget tiers.' },
  { icon: CloudSun, title: 'Smart Weather Advice', desc: 'AI-powered day-by-day weather forecasts with packing tips and activity impact alerts.' },
  { icon: MessageCircle, title: 'Trip Chat Assistant', desc: 'Ask questions and refine your trip via natural conversation.' },
  { icon: Calendar, title: 'Editable Itinerary', desc: 'Add, remove, or regenerate activities any time.' },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-white font-bold text-xl">
          <MapPin className="w-6 h-6 text-accent-400" />
          TripAI
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-primary-200 hover:text-white font-medium px-4 py-2 transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="bg-accent-500 hover:bg-accent-400 text-white font-semibold px-5 py-2 rounded-xl transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-20 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Plan your dream trip<br />
          <span className="text-accent-400">in minutes, not hours</span>
        </h1>
        <p className="text-xl text-primary-200 mb-10 max-w-2xl mx-auto">
          Describe your destination, interests, and budget. Our AI creates a complete, editable itinerary with budget breakdown and hotel recommendations.
        </p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
          Start planning for free
          <MapPin className="w-5 h-5" />
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-colors">
              <div className="w-10 h-10 bg-accent-500/20 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-accent-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
              <p className="text-primary-200 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
