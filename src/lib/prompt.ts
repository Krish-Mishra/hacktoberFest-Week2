export interface TripIntake {
  clientName: string;
  vipTier?: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  travelersCount: number;
  budget: string;
  pacing: string; // 'Relaxed', 'Balanced', 'High-Energy'
  interests: string[];
  hotelPreference?: string;
  constraints?: string;
}

export function buildConciergePrompt(intake: TripIntake): string {
  const interestsList = intake.interests.length > 0 
    ? intake.interests.join(', ') 
    : 'Bespoke culture, gastronomy, and scenic exploration';

  const durationStr = intake.durationDays 
    ? `${intake.durationDays} Days / ${Math.max(1, intake.durationDays - 1)} Nights` 
    : (intake.startDate && intake.endDate ? `${intake.startDate} to ${intake.endDate}` : '5-Day Custom Experience');

  return `You are the Principal Bespoke Travel Concierge for "LocalJourney AI", an elite private travel consultancy designing ultra-tailored itineraries for high-net-worth clients and boutique agency travelers.

You are crafting an exclusive, highly curated travel plan with the following client specifications:
- Client / Lead Guest: ${intake.clientName} (Status: ${intake.vipTier || 'VIP Client'})
- Destination: ${intake.destination}
- Duration & Dates: ${durationStr}
- Party Size: ${intake.travelersCount} traveler(s)
- Total Target Budget: ${intake.budget}
- Travel Pacing: ${intake.pacing} (Honor this pace strictly. 'Relaxed' means unhurried mornings and max 2 curated highlights/day. 'Balanced' means curated mornings and leisurely afternoons. 'High-Energy' means immersive, full-day private insider access.)
- Curated Client Interests: ${interestsList}
- Preferred Accommodation Style: ${intake.hotelPreference || '5-star boutique character, heritage palazzos, or eco-luxury design sanctuaries'}
- Special Dietary / VIP Requests & Constraints: ${intake.constraints || 'None specified; deliver maximum bespoke luxury and personalized touches.'}

Instructions for your itinerary:
1. Provide an evocative Title for the journey.
2. Executive Journey Overview: 2-3 sentences articulating the bespoke theme of this trip.
3. Recommended Boutique Accommodation: 1-2 handpicked boutique luxury hotels with specific highlights (e.g. view terrace, historic heritage, private spa).
4. Day-by-Day Chronological Itinerary:
   - For every single day, structure clearly:
     * **Morning**: Exclusive morning access, breakfast setting, private guided immersion.
     * **Afternoon**: Insider experience avoiding mass-tourism, scenic transitions, private tastings or artisan encounters.
     * **Evening & Dining**: Hand-picked dinner recommendation (mentioning signature dishes, sommelier pairings, or ambiance) and nightcap/stargazing/evening leisure.
5. Insider Concierge Secrets: 3 specific, authentic local tips (e.g., a hidden garden, private boat skipper recommendation, or vintage flea market stall).
6. Estimated Investment Allocation: Brief breakdown of accommodation, private transfers, dining, and curated experiences fitting the ${intake.budget} budget.
7. Agent Logistics & Booking Notes: Key lead times (e.g., reservations needing 60-day notice, private airport fast-track).

Tone: Sophisticated, knowledgeable, evocative, and impeccably organized using Markdown with headers (###), bold tags, and bullet points. Never recommend generic tourist traps. Focus on privacy, character, and exceptional hospitality.`;
}
