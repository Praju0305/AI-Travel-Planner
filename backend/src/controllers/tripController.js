import Trip from "../models/Trip.js";
import aiService from "../services/aiService.js";

export const getTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({ user: req.user._id })
      .select('-itinerary -chatHistory')
      .sort('-createdAt');

    res.json({ success: true, count: trips.length, trips });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single trip
// @route   GET /api/trips/:id
// @access  Private

export const getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    res.json({ success: true, trip });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a trip
// @route   POST /api/trips
// @access  Private

export const createTrip = async (req, res, next) => {
  try {
    const { destination, numberOfDays, budgetType, interests, travelStyle, startDate, notes } = req.body;

    const trip = await Trip.create({
      user: req.user._id,
      title: `${destination} Trip`,
      destination,
      numberOfDays,
      budgetType,
      interests,
      travelStyle: travelStyle || 'solo',
      startDate,
      notes,
    });

    res.status(201).json({ success: true, trip });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate AI itinerary + budget + hotels
// @route   POST /api/trips/:id/generate
// @access  Private

export const generateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const context = {
      destination: trip.destination,
      numberOfDays: trip.numberOfDays,
      budgetType: trip.budgetType,
      interests: trip.interests,
      travelStyle: trip.travelStyle,
    };

    // Run all AI calls in parallel for speed
    const [itineraryData, budgetData, hotelsData] = await Promise.all([
      aiService.generateItinerary(context),
      aiService.estimateBudget(context),
      aiService.suggestHotels(context),
    ]);

    // Update trip with generated content
    trip.title = itineraryData.title || trip.title;
    trip.itinerary = itineraryData.itinerary;
    trip.budget = budgetData;
    trip.hotels = hotelsData;
    trip.isGenerated = true;
    trip.status = 'planning';

    await trip.save();

    res.json({ success: true, trip });
  } catch (error) {
    console.error('AI generation error:', error.message);
    if (error.response?.status === 401) {
      return res.status(500).json({ success: false, message: 'Invalid Anthropic API key.' });
    }
    next(error);
  }
};

// @desc    Regenerate a specific day
// @route   PUT /api/trips/:id/days/:dayNumber/regenerate
// @access  Private

export const regenerateDay = async (req, res, next) => {
  try {
    const { preferences } = req.body;
    const dayNumber = parseInt(req.params.dayNumber);

    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const dayIndex = trip.itinerary.findIndex((d) => d.day === dayNumber);
    if (dayIndex === -1) {
      return res.status(404).json({ success: false, message: 'Day not found in itinerary.' });
    }

    const currentDay = trip.itinerary[dayIndex];
    const newDay = await aiService.regenerateDay({
      destination: trip.destination,
      dayNumber,
      currentActivities: currentDay.activities,
      preferences: preferences || 'more variety',
      numberOfDays: trip.numberOfDays,
      budgetType: trip.budgetType,
      interests: trip.interests,
    });

    trip.itinerary[dayIndex] = { ...trip.itinerary[dayIndex].toObject(), ...newDay };
    await trip.save();

    res.json({ success: true, day: trip.itinerary[dayIndex] });
  } catch (error) {
    next(error);
  }
};

// @desc    Add activity to a day
// @route   POST /api/trips/:id/days/:dayNumber/activities
// @access  Private

export const addActivity = async (req, res, next) => {
  try {
    const dayNumber = parseInt(req.params.dayNumber);
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    const dayIndex = trip.itinerary.findIndex((d) => d.day === dayNumber);
    if (dayIndex === -1) return res.status(404).json({ success: false, message: 'Day not found.' });

    trip.itinerary[dayIndex].activities.push(req.body);
    await trip.save();

    res.json({ success: true, day: trip.itinerary[dayIndex] });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove activity from a day
// @route   DELETE /api/trips/:id/days/:dayNumber/activities/:activityId
// @access  Private

export const removeActivity = async (req, res, next) => {
  try {
    const dayNumber = parseInt(req.params.dayNumber);
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    const dayIndex = trip.itinerary.findIndex((d) => d.day === dayNumber);
    if (dayIndex === -1) return res.status(404).json({ success: false, message: 'Day not found.' });

    trip.itinerary[dayIndex].activities = trip.itinerary[dayIndex].activities.filter(
      (a) => a._id.toString() !== req.params.activityId
    );
    await trip.save();

    res.json({ success: true, day: trip.itinerary[dayIndex] });
  } catch (error) {
    next(error);
  }
};

// @desc    AI chat assistant for a trip
// @route   POST /api/trips/:id/chat
// @access  Private

export const chatAssistant = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required.' });

    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    const tripContext = {
      destination: trip.destination,
      numberOfDays: trip.numberOfDays,
      budgetType: trip.budgetType,
      interests: trip.interests,
      travelStyle: trip.travelStyle,
      itinerarySummary: trip.itinerary.map((d) => ({
        day: d.day,
        theme: d.theme,
        activities: d.activities.map((a) => a.title),
      })),
      budget: trip.budget,
    };

    const assistantReply = await aiService.chatWithAssistant({
      tripContext,
      chatHistory: trip.chatHistory,
      userMessage: message,
    });

    // Save chat history
    trip.chatHistory.push({ role: 'user', content: message });
    trip.chatHistory.push({ role: 'assistant', content: assistantReply });

    // Keep chat history manageable (last 50 messages)
    if (trip.chatHistory.length > 50) {
      trip.chatHistory = trip.chatHistory.slice(-50);
    }
    await trip.save();

    res.json({ success: true, reply: assistantReply });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trip details
// @route   PUT /api/trips/:id
// @access  Private

export const updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    res.json({ success: true, trip });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete trip
// @route   DELETE /api/trips/:id
// @access  Private

export const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    res.json({ success: true, message: 'Trip deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate or refresh smart weather advice for a trip
// @route   POST /api/trips/:id/weather
// @access  Private

export const getWeatherAdvice = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    const weatherData = await aiService.generateWeatherAdvice({
      destination: trip.destination,
      numberOfDays: trip.numberOfDays,
      startDate: trip.startDate,
      interests: trip.interests,
    });

    trip.weatherAdvice = weatherData;
    await trip.save();

    res.json({ success: true, weatherAdvice: weatherData });
  } catch (error) {
    console.error('Weather advice error:', error.message);
    next(error);
  }
};