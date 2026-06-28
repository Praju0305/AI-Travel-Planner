export interface User {
  id: string;
  name: string;
  email: string;
  preferences?: { currency: string; language: string };
}

export interface Activity {
  _id?: string;
  time: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  cost: string;
  type: 'food' | 'culture' | 'adventure' | 'shopping' | 'transport' | 'accommodation' | 'other';
}

export interface DayPlan {
  _id?: string;
  day: number;
  date?: string;
  theme: string;
  activities: Activity[];
  notes: string;
}

export interface Budget {
  flights: number;
  accommodation: number;
  food: number;
  activities: number;
  transport: number;
  miscellaneous: number;
  total: number;
  currency: string;
  notes: string;
}

export interface Hotel {
  _id?: string;
  name: string;
  category: 'budget' | 'mid-range' | 'luxury';
  pricePerNight: string;
  rating: number;
  highlights: string[];
  location: string;
}

export interface ChatMessage {
  _id?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface Trip {
  _id: string;
  user: string;
  title: string;
  destination: string;
  numberOfDays: number;
  startDate?: string;
  budgetType: 'low' | 'medium' | 'high';
  interests: string[];
  travelStyle: 'solo' | 'couple' | 'family' | 'group';
  itinerary: DayPlan[];
  budget: Budget;
  hotels: Hotel[];
  chatHistory: ChatMessage[];
  weatherAdvice: WeatherAdvice | null;
  status: 'draft' | 'planning' | 'confirmed' | 'completed';
  isGenerated: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DayWeather {
  day: number;
  condition: string;
  tempHigh: string;
  tempLow: string;
  humidity: string;
  precipitation: string;
  uvIndex: string;
  wind: string;
  advice: string;
  packingTips: string[];
  activityImpact: string;
}

export interface WeatherAdvice {
  destination: string;
  travelMonth: string;
  overview: string;
  generalPackingList: string[];
  clothingRecommendations: string[];
  healthTips: string[];
  bestTimeOfDay: string;
  days: DayWeather[];
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}
