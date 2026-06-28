'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { tripsAPI } from '@/lib/api';
import { Trip, DayPlan, Activity, ChatMessage } from '@/types';
import Navbar from '@/components/layout/Navbar';
import {
  ArrowLeft, Sparkles, MapPin, DollarSign, Calendar, Hotel,
  MessageCircle, Plus, Trash2, RefreshCw, Send, ChevronDown,
  ChevronUp, Clock, Star, Loader2, X, CheckCircle, CloudSun,
  Wind, Droplets, Thermometer, Sun, AlertTriangle, Package
} from 'lucide-react';

const activityTypeColors: Record<string, string> = {
  food: 'bg-orange-100 text-orange-700',
  culture: 'bg-purple-100 text-purple-700',
  adventure: 'bg-green-100 text-green-700',
  shopping: 'bg-pink-100 text-pink-700',
  transport: 'bg-slate-100 text-slate-600',
  accommodation: 'bg-blue-100 text-blue-700',
  other: 'bg-slate-100 text-slate-600',
};

const budgetLabels: Record<string, string> = {
  low: 'Budget',
  medium: 'Moderate',
  high: 'Luxury',
};

export default function TripDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget' | 'hotels' | 'chat'>('itinerary');
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null);
  const [regenPrefs, setRegenPrefs] = useState('');
  const [showRegenModal, setShowRegenModal] = useState<number | null>(null);
  const [showAddActivity, setShowAddActivity] = useState<number | null>(null);
  const [newActivity, setNewActivity] = useState({ title: '', time: '', description: '', location: '', duration: '', cost: '', type: 'other' as Activity['type'] });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchTrip(); }, [id]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const fetchTrip = async () => {
    try {
      const { data } = await tripsAPI.getOne(id);
      setTrip(data.trip);
      setChatMessages(data.trip.chatHistory || []);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await tripsAPI.generate(id);
      setTrip(data.trip);
      setChatMessages(data.trip.chatHistory || []);
      setExpandedDays(new Set([1]));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Generation failed. Check your API key.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateDay = async (dayNumber: number) => {
    setRegeneratingDay(dayNumber);
    try {
      const { data } = await tripsAPI.regenerateDay(id, dayNumber, regenPrefs || 'more variety');
      setTrip((t) => t ? { ...t, itinerary: t.itinerary.map((d) => d.day === dayNumber ? data.day : d) } : t);
      setShowRegenModal(null);
      setRegenPrefs('');
    } catch {
      alert('Failed to regenerate day.');
    } finally {
      setRegeneratingDay(null);
    }
  };

  const handleRemoveActivity = async (dayNumber: number, activityId: string) => {
    if (!confirm('Remove this activity?')) return;
    try {
      const { data } = await tripsAPI.removeActivity(id, dayNumber, activityId);
      setTrip((t) => t ? { ...t, itinerary: t.itinerary.map((d) => d.day === dayNumber ? data.day : d) } : t);
    } catch { alert('Failed to remove activity.'); }
  };

  const handleAddActivity = async (dayNumber: number) => {
    if (!newActivity.title) return;
    try {
      const { data } = await tripsAPI.addActivity(id, dayNumber, newActivity);
      setTrip((t) => t ? { ...t, itinerary: t.itinerary.map((d) => d.day === dayNumber ? data.day : d) } : t);
      setShowAddActivity(null);
      setNewActivity({ title: '', time: '', description: '', location: '', duration: '', cost: '', type: 'other' });
    } catch { alert('Failed to add activity.'); }
  };

  const handleGetWeather = async () => {
    setWeatherLoading(true);
    try {
      const { data } = await tripsAPI.getWeatherAdvice(id);
      setTrip((t) => t ? { ...t, weatherAdvice: data.weatherAdvice } : t);
    } catch {
      alert('Failed to fetch weather advice. Please try again.');
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages((m) => [...m, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const { data } = await tripsAPI.chat(id, msg);
      setChatMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch { setChatMessages((m) => [...m, { role: 'assistant', content: "Sorry, I couldn't process that. Please try again." }]); }
    finally { setChatLoading(false); }
  };

  const toggleDay = (day: number) => {
    setExpandedDays((s) => { const n = new Set(s); n.has(day) ? n.delete(day) : n.add(day); return n; });
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    </div>
  );

  if (!trip) return null;

  const tabs = [
    { id: 'itinerary', label: 'Itinerary', icon: Calendar },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'hotels', label: 'Hotels', icon: Hotel },
    { id: 'weather', label: 'Weather', icon: CloudSun },
    { id: 'chat', label: 'AI Chat', icon: MessageCircle },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />Back to dashboard
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{trip.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{trip.destination}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{trip.numberOfDays} days</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{budgetLabels[trip.budgetType]}</span>
              </div>
            </div>
            {!trip.isGenerated && (
              <button onClick={handleGenerate} disabled={generating} className="btn-primary flex-shrink-0">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate itinerary</>}
              </button>
            )}
          </div>

          {trip.isGenerated && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-3 py-2 w-fit">
              <CheckCircle className="w-4 h-4" />AI itinerary generated
            </div>
          )}
        </div>

        {/* Generating overlay */}
        {generating && (
          <div className="card p-10 text-center mb-6 animate-pulse-slow">
            <Sparkles className="w-10 h-10 text-accent-500 mx-auto mb-3 animate-spin" />
            <p className="font-semibold text-slate-800">AI is crafting your perfect trip...</p>
            <p className="text-slate-400 text-sm mt-1">Building itinerary, budget, and hotel suggestions simultaneously</p>
          </div>
        )}

        {/* Tabs */}
        {trip.isGenerated && (
          <>
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-6">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === id ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block">{label}</span>
                </button>
              ))}
            </div>

            {/* Itinerary Tab */}
            {activeTab === 'itinerary' && (
              <div className="space-y-3 animate-fade-in">
                {trip.itinerary.map((day: DayPlan) => (
                  <div key={day.day} className="card overflow-hidden">
                    <button onClick={() => toggleDay(day.day)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {day.day}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-slate-900">Day {day.day}</div>
                          <div className="text-sm text-slate-400">{day.theme}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{day.activities.length} activities</span>
                        {expandedDays.has(day.day) ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {expandedDays.has(day.day) && (
                      <div className="border-t border-slate-100 p-4">
                        <div className="space-y-3">
                          {day.activities.map((activity: Activity) => (
                            <div key={activity._id} className="flex items-start gap-3 group p-3 rounded-xl hover:bg-slate-50 transition-colors">
                              <div className="text-xs text-slate-400 w-16 flex-shrink-0 pt-0.5">{activity.time}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-slate-900 text-sm">{activity.title}</span>
                                  <span className={`badge text-xs ${activityTypeColors[activity.type] || activityTypeColors.other}`}>
                                    {activity.type}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mb-1">{activity.description}</p>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                  {activity.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{activity.location}</span>}
                                  {activity.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.duration}</span>}
                                  {activity.cost && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{activity.cost}</span>}
                                </div>
                              </div>
                              <button onClick={() => handleRemoveActivity(day.day, activity._id!)}
                                className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Day actions */}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                          <button onClick={() => setShowAddActivity(day.day)}
                            className="btn-secondary text-xs px-3 py-1.5">
                            <Plus className="w-3.5 h-3.5" />Add activity
                          </button>
                          <button onClick={() => setShowRegenModal(day.day)}
                            disabled={regeneratingDay === day.day}
                            className="btn-secondary text-xs px-3 py-1.5">
                            {regeneratingDay === day.day ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            Regenerate day
                          </button>
                          {day.notes && <p className="text-xs text-slate-400 mt-1 italic">💡 {day.notes}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Budget Tab */}
            {activeTab === 'budget' && trip.budget && (
              <div className="space-y-4 animate-fade-in">
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Estimated budget</h2>
                  <div className="space-y-3">
                    {(['flights', 'accommodation', 'food', 'activities', 'transport', 'miscellaneous'] as const).map((key) => (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <span className="text-slate-600 capitalize">{key}</span>
                        <span className="font-medium text-slate-900">
                          {trip.budget.currency} {trip.budget[key].toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-3 font-bold text-lg">
                      <span className="text-slate-900">Total</span>
                      <span className="text-primary-600">{trip.budget.currency} {trip.budget.total.toLocaleString()}</span>
                    </div>
                  </div>
                  {trip.budget.notes && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                      💡 {trip.budget.notes}
                    </div>
                  )}
                </div>

                {/* Budget breakdown visual */}
                <div className="card p-6">
                  <h3 className="font-semibold text-slate-700 mb-3 text-sm">Breakdown</h3>
                  <div className="space-y-2">
                    {(['flights', 'accommodation', 'food', 'activities', 'transport', 'miscellaneous'] as const).map((key) => {
                      const pct = trip.budget.total > 0 ? Math.round((trip.budget[key] / trip.budget.total) * 100) : 0;
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span className="capitalize">{key}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Hotels Tab */}
            {activeTab === 'hotels' && (
              <div className="space-y-3 animate-fade-in">
                {['budget', 'mid-range', 'luxury'].map((cat) => (
                  <div key={cat}>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1 capitalize">{cat}</h3>
                    <div className="space-y-2">
                      {trip.hotels.filter((h) => h.category === cat).map((hotel) => (
                        <div key={hotel._id} className="card p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-semibold text-slate-900">{hotel.name}</h4>
                              <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />{hotel.location}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-semibold text-slate-900 text-sm">{hotel.pricePerNight}/night</div>
                              <div className="flex items-center gap-0.5 text-amber-400 text-xs mt-0.5 justify-end">
                                <Star className="w-3 h-3 fill-current" />
                                {hotel.rating}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {hotel.highlights.map((h, i) => (
                              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{h}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Weather Tab */}
            {activeTab === 'weather' && (
              <div className="animate-fade-in space-y-4">
                {!trip.weatherAdvice ? (
                  <div className="card p-10 text-center">
                    <CloudSun className="w-12 h-12 text-sky-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-800 text-lg mb-2">Smart Weather Advice</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
                      Get AI-powered day-by-day weather forecasts with packing tips, clothing recommendations, and activity impact alerts tailored to {trip.destination}.
                    </p>
                    <button onClick={handleGetWeather} disabled={weatherLoading} className="btn-primary">
                      {weatherLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Analysing weather...</> : <><CloudSun className="w-4 h-4" />Get weather advice</>}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Overview card */}
                    <div className="card p-5 bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CloudSun className="w-5 h-5 text-sky-500" />
                            <h2 className="font-semibold text-slate-900">Weather overview — {trip.weatherAdvice.travelMonth}</h2>
                          </div>
                          <p className="text-sm text-slate-600">{trip.weatherAdvice.overview}</p>
                        </div>
                        <button onClick={handleGetWeather} disabled={weatherLoading}
                          className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0">
                          {weatherLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          Refresh
                        </button>
                      </div>
                      {trip.weatherAdvice.bestTimeOfDay && (
                        <div className="flex items-start gap-2 p-3 bg-white/70 rounded-xl text-sm text-slate-700">
                          <Sun className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{trip.weatherAdvice.bestTimeOfDay}</span>
                        </div>
                      )}
                    </div>

                    {/* Packing & Clothing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="card p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="w-4 h-4 text-primary-500" />
                          <h3 className="font-semibold text-slate-800 text-sm">What to pack</h3>
                        </div>
                        <ul className="space-y-1.5">
                          {(trip.weatherAdvice.generalPackingList || []).map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                              <div className="w-1.5 h-1.5 bg-primary-400 rounded-full flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="card p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-accent-500" />
                          <h3 className="font-semibold text-slate-800 text-sm">Clothing tips</h3>
                        </div>
                        <ul className="space-y-1.5">
                          {(trip.weatherAdvice?.clothingRecommendations || []).map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                              <div className="w-1.5 h-1.5 bg-accent-400 rounded-full flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                        {trip.weatherAdvice.healthTips.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-xs font-medium text-slate-600">Health tips</span>
                            </div>
                            {(trip.weatherAdvice.healthTips || []).map((tip, i) => (
                              <p key={i} className="text-xs text-slate-500 mb-1">{tip}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Day-by-day weather */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">Day-by-day forecast</h3>
                      <div className="space-y-3">
                        {(trip.weatherAdvice.days || []).map((dayW) => (
                          <div key={dayW.day} className="card p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {dayW.day}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-900 text-sm">{dayW.condition}</div>
                                <div className="text-xs text-slate-400">Day {dayW.day}</div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                                  <Thermometer className="w-3.5 h-3.5 text-red-400" />
                                  {dayW.tempHigh}
                                </div>
                                <div className="text-xs text-slate-400">{dayW.tempLow}</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {[
                                { icon: Droplets, label: 'Rain', value: dayW.precipitation, color: 'text-blue-500' },
                                { icon: Wind, label: 'Wind', value: dayW.wind, color: 'text-slate-500' },
                                { icon: Sun, label: 'UV', value: dayW.uvIndex, color: 'text-amber-500' },
                              ].map(({ icon: Icon, label, value, color }) => (
                                <div key={label} className="bg-slate-50 rounded-xl p-2 text-center">
                                  <Icon className={`w-3.5 h-3.5 mx-auto mb-0.5 ${color}`} />
                                  <div className="text-xs text-slate-400">{label}</div>
                                  <div className="text-xs font-medium text-slate-700 truncate">{value}</div>
                                </div>
                              ))}
                            </div>

                            <div className="p-2.5 bg-sky-50 rounded-xl mb-2">
                              <p className="text-xs text-sky-800">{dayW.advice}</p>
                            </div>

                            {dayW.activityImpact && (
                              <div className="flex items-start gap-1.5 p-2 bg-amber-50 rounded-xl">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800">{dayW.activityImpact}</p>
                              </div>
                            )}

                            {dayW.packingTips.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {dayW.packingTips.map((tip, i) => (
                                  <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full border border-primary-100">
                                    {tip}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="card flex flex-col animate-fade-in" style={{ height: '60vh' }}>
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">Trip Assistant</div>
                      <div className="text-xs text-green-500">● Online</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                      <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Ask me anything about your trip!</p>
                      <p className="text-slate-300 text-xs mt-1">e.g. "What should I pack?" or "Suggest vegan restaurants on Day 2"</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-3 border-t border-slate-100">
                  <div className="flex gap-2">
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChat()}
                      className="input text-sm" placeholder="Ask about your trip..." />
                    <button onClick={handleChat} disabled={!chatInput.trim() || chatLoading}
                      className="btn-primary px-3 py-2">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Not yet generated state */}
        {!trip.isGenerated && !generating && (
          <div className="card p-12 text-center">
            <Sparkles className="w-12 h-12 text-accent-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Ready to plan your trip?</h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Click &quot;Generate itinerary&quot; above and our AI will create a day-by-day plan, budget estimate, and hotel suggestions for {trip.destination}.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {trip.interests.map((i) => (
                <span key={i} className="badge bg-primary-100 text-primary-700">{i}</span>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Regenerate Day Modal */}
      {showRegenModal !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Regenerate Day {showRegenModal}</h3>
              <button onClick={() => setShowRegenModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea value={regenPrefs} onChange={(e) => setRegenPrefs(e.target.value)}
              className="input resize-none mb-4" rows={3}
              placeholder="e.g. more outdoor activities, focus on local food, add evening entertainment..." />
            <div className="flex gap-2">
              <button onClick={() => setShowRegenModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleRegenerateDay(showRegenModal)}
                disabled={regeneratingDay !== null} className="btn-primary flex-1">
                {regeneratingDay !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {showAddActivity !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Add Activity to Day {showAddActivity}</h3>
              <button onClick={() => setShowAddActivity(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input value={newActivity.title} onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                className="input" placeholder="Activity title *" />
              <div className="grid grid-cols-2 gap-2">
                <input value={newActivity.time} onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                  className="input" placeholder="Time (e.g. 10:00 AM)" />
                <input value={newActivity.duration} onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                  className="input" placeholder="Duration" />
              </div>
              <input value={newActivity.location} onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                className="input" placeholder="Location" />
              <input value={newActivity.cost} onChange={(e) => setNewActivity({ ...newActivity, cost: e.target.value })}
                className="input" placeholder="Estimated cost" />
              <textarea value={newActivity.description} onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                className="input resize-none" rows={2} placeholder="Description" />
              <select value={newActivity.type} onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as Activity['type'] })}
                className="input">
                {['food', 'culture', 'adventure', 'shopping', 'transport', 'accommodation', 'other'].map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAddActivity(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleAddActivity(showAddActivity)}
                disabled={!newActivity.title} className="btn-primary flex-1">
                <Plus className="w-4 h-4" />Add activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
