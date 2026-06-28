'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { tripsAPI } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import { MapPin, ArrowLeft, Sparkles, ChevronRight } from 'lucide-react';

const INTERESTS = ['Food & Cuisine', 'Culture & History', 'Adventure & Sports', 'Shopping', 'Nature & Outdoors', 'Nightlife', 'Art & Museums', 'Wellness & Spa', 'Architecture', 'Photography'];
const TRAVEL_STYLES = ['solo', 'couple', 'family', 'group'];
const BUDGET_TYPES = [
  { value: 'low', label: 'Budget', desc: 'Hostels, street food, free attractions', emoji: '🎒' },
  { value: 'medium', label: 'Moderate', desc: '3-star hotels, restaurants, paid tours', emoji: '✈️' },
  { value: 'high', label: 'Luxury', desc: '5-star hotels, fine dining, VIP experiences', emoji: '💎' },
];

export default function NewTripPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    destination: '',
    numberOfDays: 5,
    budgetType: 'medium',
    interests: [] as string[],
    travelStyle: 'solo',
    startDate: '',
    notes: '',
  });

  const toggleInterest = (interest: string) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter((i) => i !== interest)
        : [...f.interests, interest],
    }));
  };

  const handleSubmit = async () => {
    if (!form.destination) { setError('Please enter a destination.'); return; }
    if (form.interests.length === 0) { setError('Please select at least one interest.'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await tripsAPI.create(form);
      router.push(`/trips/${data.trip._id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to create trip.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
        </div>

        <div className="card p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-accent-500" />
              <h1 className="text-2xl font-bold text-slate-900">Plan a new trip</h1>
            </div>
            <p className="text-slate-500">Tell us about your trip and our AI will create a personalized itinerary.</p>

            {/* Steps indicator */}
            <div className="flex items-center gap-2 mt-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= s ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {s}
                  </div>
                  {s < 3 && <div className={`h-0.5 w-8 transition-colors ${step > s ? 'bg-primary-600' : 'bg-slate-200'}`} />}
                </div>
              ))}
              <span className="text-sm text-slate-400 ml-2">
                {step === 1 ? 'Destination' : step === 2 ? 'Interests' : 'Preferences'}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="label">Where are you going? *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input type="text" value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    className="input pl-9" placeholder="e.g. Tokyo, Japan" />
                </div>
              </div>

              <div>
                <label className="label">How many days? *</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setForm({ ...form, numberOfDays: Math.max(1, form.numberOfDays - 1) })}
                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold">−</button>
                  <span className="text-2xl font-bold text-slate-900 w-12 text-center">{form.numberOfDays}</span>
                  <button onClick={() => setForm({ ...form, numberOfDays: Math.min(30, form.numberOfDays + 1) })}
                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold">+</button>
                  <span className="text-slate-400 text-sm">days</span>
                </div>
              </div>

              <div>
                <label className="label">Start date (optional)</label>
                <input type="date" value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="input" min={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="animate-fade-in">
              <label className="label">What are your interests? * (select all that apply)</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {INTERESTS.map((interest) => (
                  <button key={interest} onClick={() => toggleInterest(interest)}
                    className={`p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                      form.interests.includes(interest)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}>
                    {interest}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">{form.interests.length} selected</p>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="label">Budget preference *</label>
                <div className="space-y-2">
                  {BUDGET_TYPES.map(({ value, label, desc, emoji }) => (
                    <button key={value} onClick={() => setForm({ ...form, budgetType: value })}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        form.budgetType === value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{emoji}</span>
                        <div>
                          <div className={`font-semibold ${form.budgetType === value ? 'text-primary-700' : 'text-slate-800'}`}>{label}</div>
                          <div className="text-xs text-slate-400">{desc}</div>
                        </div>
                        {form.budgetType === value && (
                          <div className="ml-auto w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Travel style</label>
                <div className="flex gap-2">
                  {TRAVEL_STYLES.map((style) => (
                    <button key={style} onClick={() => setForm({ ...form, travelStyle: style })}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium capitalize transition-all ${
                        form.travelStyle === style
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Additional notes (optional)</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input resize-none" rows={3}
                  placeholder="e.g. We have kids, prefer morning activities, vegetarian..." />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="btn-secondary">← Back</button>
            ) : <div />}

            {step < 3 ? (
              <button onClick={() => {
                if (step === 1 && !form.destination) { setError('Please enter a destination.'); return; }
                if (step === 2 && form.interests.length === 0) { setError('Please select at least one interest.'); return; }
                setError('');
                setStep(step + 1);
              }} className="btn-primary">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                {loading ? <span className="spinner" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Creating...' : 'Create trip'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
