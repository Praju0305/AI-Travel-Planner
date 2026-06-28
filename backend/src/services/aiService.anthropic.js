import axios from "axios";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const callClaude = async (prompt, systemPrompt = "") => {
  try {
    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      },
    );

    return response.data.content[0].text;
  } catch (error) {
    console.log("Anthropic Error:");
    console.log(error.response?.data || error.message);
    throw error;
  }
};

// Generate complete trip itinerary
const generateItinerary = async ({
  destination,
  numberOfDays,
  budgetType,
  interests,
  travelStyle,
}) => {
  const systemPrompt = `You are an expert travel planner. Always respond with valid JSON only. No markdown, no explanation.`;

  const prompt = `Create a detailed ${numberOfDays}-day travel itinerary for ${destination}.
Traveler profile:
- Budget: ${budgetType} (low = backpacker, medium = comfortable, high = luxury)
- Interests: ${interests.join(", ")}
- Travel style: ${travelStyle}

Return ONLY this JSON structure:
{
  "title": "Trip title",
  "itinerary": [
    {
      "day": 1,
      "theme": "Day theme",
      "activities": [
        {
          "time": "9:00 AM",
          "title": "Activity name",
          "description": "Brief description",
          "location": "Specific location/address",
          "duration": "2 hours",
          "cost": "$10-20",
          "type": "culture|food|adventure|shopping|transport|other"
        }
      ],
      "notes": "Tips for this day"
    }
  ]
}
Include 4-6 activities per day. Be specific with locations and costs for ${destination}.`;

  const text = await callClaude(prompt, systemPrompt);

  // Clean and parse JSON
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
};

// Estimate budget
const estimateBudget = async ({
  destination,
  numberOfDays,
  budgetType,
  travelStyle,
}) => {
  const systemPrompt = `You are a travel finance expert. Always respond with valid JSON only. No markdown.`;

  const prompt = `Estimate a realistic travel budget for:
- Destination: ${destination}
- Duration: ${numberOfDays} days
- Budget type: ${budgetType}
- Travel style: ${travelStyle}

Return ONLY this JSON:
{
  "flights": 0,
  "accommodation": 0,
  "food": 0,
  "activities": 0,
  "transport": 0,
  "miscellaneous": 0,
  "total": 0,
  "currency": "USD",
  "notes": "Brief budget tips"
}
All values should be numbers (total for the trip, not per day). Be realistic for ${destination}.`;

  const text = await callClaude(prompt, systemPrompt);
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
};

// Suggest hotels
const suggestHotels = async ({ destination, budgetType, numberOfDays }) => {
  const systemPrompt = `You are a travel accommodation expert. Always respond with valid JSON only. No markdown.`;

  const prompt = `Suggest 6 hotels in ${destination} for a ${budgetType} budget traveler (${numberOfDays} nights).
Include 2 budget, 2 mid-range, and 2 luxury options.

Return ONLY this JSON array:
[
  {
    "name": "Hotel Name",
    "category": "budget|mid-range|luxury",
    "pricePerNight": "$X-Y",
    "rating": 4.2,
    "highlights": ["highlight 1", "highlight 2", "highlight 3"],
    "location": "Neighborhood, ${destination}"
  }
]`;

  const text = await callClaude(prompt, systemPrompt);
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
};

// Regenerate a specific day
const regenerateDay = async ({
  destination,
  dayNumber,
  currentActivities,
  preferences,
  numberOfDays,
  budgetType,
  interests,
}) => {
  const systemPrompt = `You are an expert travel planner. Always respond with valid JSON only. No markdown.`;

  const prompt = `Regenerate Day ${dayNumber} of a ${numberOfDays}-day trip to ${destination}.
Budget: ${budgetType}, Interests: ${interests.join(", ")}
User preferences for this day: "${preferences}"
Current activities to AVOID repeating: ${currentActivities.map((a) => a.title).join(", ")}

Return ONLY this JSON:
{
  "day": ${dayNumber},
  "theme": "New theme",
  "activities": [
    {
      "time": "9:00 AM",
      "title": "Activity name",
      "description": "Brief description",
      "location": "Specific location",
      "duration": "2 hours",
      "cost": "$10-20",
      "type": "culture|food|adventure|shopping|transport|other"
    }
  ],
  "notes": "Tips for this day"
}
Include 4-6 activities. Focus on: ${preferences}`;

  const text = await callClaude(prompt, systemPrompt);
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
};

// Chat assistant for trip refinement
const chatWithAssistant = async ({ tripContext, chatHistory, userMessage }) => {
  const systemPrompt = `You are a friendly and knowledgeable travel assistant helping a user plan and refine their trip.
Trip context: ${JSON.stringify(tripContext)}
You know the full itinerary and can help modify it, answer questions, give local tips, and suggest alternatives.
Keep responses concise, friendly, and actionable (max 150 words).
If the user wants to modify the itinerary, describe what changes to make clearly.`;

  const messages = [
    ...chatHistory
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const response = await axios.post(
    ANTHROPIC_API_URL,
    {
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: systemPrompt,
      messages,
    },
    {
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.content[0].text;
};

// Generate smart weather advice per day
const generateWeatherAdvice = async ({
  destination,
  numberOfDays,
  startDate,
  interests,
}) => {
  const systemPrompt = `You are a travel weather expert. Always respond with valid JSON only. No markdown, no explanation.`;

  const travelMonth = startDate
    ? new Date(startDate).toLocaleString("en", { month: "long" })
    : "the planned travel period";

  const prompt = `Generate smart weather advice for a ${numberOfDays}-day trip to ${destination} in ${travelMonth}.
Traveler interests: ${interests.join(", ")}.

Return ONLY this JSON:
{
  "destination": "${destination}",
  "travelMonth": "${travelMonth}",
  "overview": "2-3 sentence summary of expected weather",
  "generalPackingList": ["item1", "item2", "item3", "item4", "item5"],
  "clothingRecommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "healthTips": ["tip1", "tip2"],
  "bestTimeOfDay": "Best time to do outdoor activities and why",
  "days": [
    {
      "day": 1,
      "condition": "Partly cloudy",
      "tempHigh": "28°C / 82°F",
      "tempLow": "20°C / 68°F",
      "humidity": "65%",
      "precipitation": "10%",
      "uvIndex": "High (7)",
      "wind": "Light 15 km/h",
      "advice": "Good day for outdoor sightseeing. Carry sunscreen.",
      "packingTips": ["sunscreen", "light jacket for evening"],
      "activityImpact": "Ideal for outdoor activities planned today"
    }
  ]
}
Generate a day entry for each of the ${numberOfDays} days. Vary conditions realistically for ${destination} in ${travelMonth}. Be specific and actionable.`;

  const text = await callClaude(prompt, systemPrompt);
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
};

export default {
  generateItinerary,
  estimateBudget,
  suggestHotels,
  regenerateDay,
  chatWithAssistant,
  generateWeatherAdvice,
};
