'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MapPin, LogOut, User, Plus } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary-700">
            <MapPin className="w-6 h-6 text-accent-500" />
            TripAI
          </Link>

          {user && (
            <div className="flex items-center gap-3">
              <Link href="/trips/new" className="btn-primary text-sm px-3 py-2">
                <Plus className="w-4 h-4" />
                New trip
              </Link>
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <span className="text-sm font-medium hidden sm:block">{user.name}</span>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
