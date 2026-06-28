import { GoogleGenerativeAI } from "@google/generative-ai";

const callGemini = async (prompt, systemPrompt = "") => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);

  return result.response.text();
};

// Generate complete trip itinerary
const generateItinerary = async ({
  destination,
  numberOfDays,
  budgetType,
  interests,
  travelStyle,
}) => {
  const systemPrompt = `
You are an expert travel planner.
Always return ONLY valid JSON.
Do not use markdown.
Do not explain anything.
`;

  const prompt = `
Create a ${numberOfDays}-day itinerary for ${destination}.

Budget: ${budgetType}
Travel Style: ${travelStyle}
Interests: ${interests.join(", ")}

Return ONLY this JSON:

{
  "title": "Trip Title",
  "itinerary": [
    {
      "day": 1,
      "theme": "Theme",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Activity",
          "description": "Description",
          "location": "Location",
          "duration": "2 hours",
          "cost": "$20",
          "type": "culture"
        }
      ],
      "notes": "Tips"
    }
  ]
}
`;

  const text = await callGemini(prompt, systemPrompt);

  console.log("========== GEMINI RESPONSE ==========");
  console.log(text);
  console.log("=====================================");

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
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
  const systemPrompt = `
You are a travel finance expert.
Always return ONLY valid JSON.
`;

  const prompt = `
Estimate the total travel budget for:

Destination: ${destination}
Duration: ${numberOfDays} days
Budget: ${budgetType}
Travel Style: ${travelStyle}

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
  "notes": "Budget tips"
}
`;

  const text = await callGemini(prompt, systemPrompt);

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
};

// Suggest hotels
const suggestHotels = async ({ destination, budgetType, numberOfDays }) => {
  const systemPrompt = `
You are a travel accommodation expert.
Always return ONLY valid JSON.
`;

  const prompt = `
Suggest 6 hotels for a trip to ${destination}.

Budget: ${budgetType}
Duration: ${numberOfDays} nights

Include:
- 2 Budget
- 2 Mid-range
- 2 Luxury

Return ONLY this JSON:

[
  {
    "name": "Hotel Name",
    "category": "budget",
    "pricePerNight": "$40-60",
    "rating": 4.5,
    "highlights": [
      "Free WiFi",
      "Near Metro",
      "Breakfast Included"
    ],
    "location": "Shinjuku"
  }
]
`;

  const text = await callGemini(prompt, systemPrompt);

  console.log("========== GEMINI RESPONSE ==========");
  console.log(text);
  console.log("=====================================");

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
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
  const systemPrompt = `
You are an expert travel planner.
Always return ONLY valid JSON.
`;

  const prompt = `
Regenerate Day ${dayNumber} of a ${numberOfDays}-day trip to ${destination}.

Budget: ${budgetType}
Interests: ${interests.join(", ")}

Avoid these activities:
${currentActivities.map((a) => a.title).join(", ")}

User preference:
${preferences}

Return ONLY:

{
  "day": ${dayNumber},
  "theme": "Theme",
  "activities": [
    {
      "time": "09:00 AM",
      "title": "Activity",
      "description": "Description",
      "location": "Location",
      "duration": "2 hours",
      "cost": "$20",
      "type": "culture"
    }
  ],
  "notes": "Tips"
}
`;

  const text = await callGemini(prompt, systemPrompt);

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
};

// Chat assistant
const chatWithAssistant = async ({ tripContext, chatHistory, userMessage }) => {
  const systemPrompt = `
You are a friendly travel assistant.

Trip Context:
${JSON.stringify(tripContext)}

Provide concise and helpful travel advice.
Keep responses under 150 words.
`;

  const prompt = `
Conversation:

${chatHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}

User:
${userMessage}
`;

  return await callGemini(prompt, systemPrompt);
};

// Weather advice
const generateWeatherAdvice = async ({
  destination,
  numberOfDays,
  startDate,
  interests,
}) => {
  const systemPrompt = `
You are a travel weather expert.

Always return ONLY valid JSON.
`;

  const month = startDate
    ? new Date(startDate).toLocaleString("en", {
        month: "long",
      })
    : "the travel period";

  const prompt = `
Generate weather advice for a ${numberOfDays}-day trip.

Destination:
${destination}

Travel Month:
${month}

Traveler Interests:
${interests.join(", ")}

Return ONLY this JSON:

{
  "destination":"${destination}",
  "overview":"Summary",
  "generalPackingList":[
    "Umbrella",
    "Comfortable shoes"
  ],
  "clothingRecommendations":[
    "Wear breathable cotton clothes",
    "Carry a light jacket",
    "Wear comfortable walking shoes"
  ],
  "healthTips":[
    "Stay hydrated",
    "Use sunscreen"
  ],
  "bestTimeOfDay":"Morning and evening",

  "days":[
    {
      "day":1,
      "condition":"Sunny",
      "advice":"Carry sunscreen."
    }
  ]
}

IMPORTANT:
Return ALL fields exactly.
Do not omit clothingRecommendations, healthTips or bestTimeOfDay.
`;

  const text = await callGemini(prompt, systemPrompt);

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
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
