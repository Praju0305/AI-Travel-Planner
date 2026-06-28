'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { tripsAPI } from '@/lib/api';
import { Trip } from '@/types';
import Navbar from '@/components/layout/Navbar';
import {
  MapPin, Plus, Calendar, DollarSign, Trash2, Sparkles,
  Plane, Clock, ChevronRight
} from 'lucide-react';

const budgetColors = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-purple-100 text-purple-700',
};

const statusColors = {
  draft: 'bg-slate-100 text-slate-600',
  planning: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-slate-100 text-slate-500',
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchTrips();
  }, [user]);

  const fetchTrips = async () => {
    try {
      const { data } = await tripsAPI.getAll();
      setTrips(data.trips);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trip?')) return;
    setDeleting(id);
    try {
      await tripsAPI.delete(id);
      setTrips((t) => t.filter((tr) => tr._id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.name.split(' ')[0]}! ✈️</h1>
            <p className="text-slate-500 mt-1">
              {trips.length === 0 ? 'Plan your first adventure' : `You have ${trips.length} trip${trips.length > 1 ? 's' : ''} planned`}
            </p>
          </div>
          <Link href="/trips/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New trip
          </Link>
        </div>

        {/* Stats */}
        {trips.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total trips', value: trips.length, icon: Plane, color: 'text-primary-600' },
              { label: 'Days planned', value: trips.reduce((s, t) => s + t.numberOfDays, 0), icon: Calendar, color: 'text-accent-500' },
              { label: 'Destinations', value: new Set(trips.map((t) => t.destination)).size, icon: MapPin, color: 'text-green-600' },
              { label: 'AI generated', value: trips.filter((t) => t.isGenerated).length, icon: Sparkles, color: 'text-purple-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{value}</div>
                    <div className="text-xs text-slate-500">{label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trip cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-6" />
                <div className="h-8 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No trips yet</h3>
            <p className="text-slate-500 mb-6">Start by planning your first AI-powered adventure</p>
            <Link href="/trips/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              Plan a trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip) => (
              <div key={trip._id} className="card p-6 hover:shadow-md transition-shadow group cursor-pointer relative"
                onClick={() => router.push(`/trips/${trip._id}`)}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(trip._id); }}
                  disabled={deleting === trip._id}
                  className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  {deleting === trip._id ? <span className="spinner spinner-dark" /> : <Trash2 className="w-4 h-4" />}
                </button>

                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate pr-6">{trip.title}</h3>
                    <p className="text-sm text-slate-500">{trip.destination}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className={`badge ${budgetColors[trip.budgetType]}`}>
                    <DollarSign className="w-3 h-3 mr-0.5" />
                    {trip.budgetType}
                  </span>
                  <span className={`badge ${statusColors[trip.status]}`}>
                    {trip.status}
                  </span>
                  {trip.isGenerated && (
                    <span className="badge bg-purple-100 text-purple-700">
                      <Sparkles className="w-3 h-3 mr-0.5" />
                      AI
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {trip.numberOfDays} days
                  </div>
                  <div className="flex items-center gap-1 text-primary-600 font-medium">
                    View trip
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
