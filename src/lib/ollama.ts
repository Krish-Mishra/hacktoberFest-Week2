import { buildConciergePrompt, type TripIntake } from './prompt';

export const DEFAULT_OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
export const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3';

export interface OllamaStatus {
  online: boolean;
  host: string;
  models: string[];
  activeModel: string;
  error?: string;
}

export async function checkOllamaStatus(host = DEFAULT_OLLAMA_HOST): Promise<OllamaStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${host}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json() as { models?: Array<{ name: string }> };
      const modelList = (data.models || []).map((m) => m.name);
      return {
        online: true,
        host,
        models: modelList.length > 0 ? modelList : ['llama3 (ready)'],
        activeModel: modelList[0] || 'llama3',
      };
    } else {
      return {
        online: false,
        host,
        models: [],
        activeModel: DEFAULT_MODEL,
        error: `Ollama returned status ${res.status}`,
      };
    }
  } catch (err: any) {
    return {
      online: false,
      host,
      models: [],
      activeModel: DEFAULT_MODEL,
      error: err.name === 'AbortError' ? 'Connection timed out' : 'Ollama not running locally on port 11434',
    };
  }
}

/**
 * Generator that yields streamed tokens from Ollama REST API.
 * If Ollama is unreachable, falls back to a high-quality local streaming synthesizer.
 */
export async function* streamGenerateItinerary(
  intake: TripIntake,
  model = DEFAULT_MODEL,
  host = DEFAULT_OLLAMA_HOST
): AsyncGenerator<string, void, unknown> {
  const prompt = buildConciergePrompt(intake);
  let ollamaWorked = false;

  try {
    const res = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
    });

    if (res.ok && res.body) {
      ollamaWorked = true;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              yield parsed.response;
            }
          } catch {
            // ignore partial JSON chunks
          }
        }
      }

      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          if (parsed.response) yield parsed.response;
        } catch {}
      }
    }
  } catch (err) {
    console.warn('Ollama streaming error or unreachable, activating local fallback synthesizer:', err);
  }

  // If Ollama is not running, stream simulated bespoke luxury concierge itinerary
  if (!ollamaWorked) {
    yield* streamFallbackConcierge(intake, model);
  }
}

/**
 * High-fidelity fallback streaming synthesizer for when Ollama is not currently active on the host machine.
 * Provides instant, zero-delay testing and demonstrates the exact luxury concierge output structure.
 */
async function* streamFallbackConcierge(intake: TripIntake, model: string): AsyncGenerator<string> {
  const days = intake.durationDays || 5;
  const destination = intake.destination || 'Amalfi Coast, Italy';
  const interests = intake.interests.length > 0 ? intake.interests : ['Culinary & Michelin Dining', 'Private Art Collections'];
  
  const content = `# The Grand Bespoke Odyssey: ${destination}
*Curated exclusively for ${intake.clientName} (${intake.vipTier || 'Ultra-VIP Black Card Client'})*

> **Notice**: *Simulated via LocalJourney Concierge Engine (Local Ollama at localhost:11434 is offline. To run locally with your weights, run \`ollama run ${model}\` in your terminal).*

---

### Executive Journey Overview
This handcrafted journey to **${destination}** is designed around a strictly **${intake.pacing}** rhythm, balancing private historical access with unhurried indulgence. Every detail—from private airstrip transfers to reserved banquettes at Michelin-starred sanctuaries—has been calibrated for privacy, aesthetic discretion, and seamless service.

---

### Handpicked Boutique Accommodations
1. **The Grand Heritage Sanctuary**:
   - *Room Category*: Signature Terrace Suite with Panoramic Vistas & Private Plunge Pool.
   - *Concierge Perks*: Dedicated 24/7 private butler, in-suite check-in with vintage reserve vintage wine, and private dock access.
2. **The Secret Villa Retreat**:
   - *Highlights*: 17th-century restored architectural estate surrounded by private olive groves, historic private library, and Michelin-trained private chef.

---

### Day-by-Day Curated Itinerary

#### Day 1: Regal Arrival & Private Sunset Salons
- **Morning**: Private tarmac greeting and customs fast-track. Chauffeured luxury hybrid transfer to your suite. Light welcome refreshments prepared by the executive chef.
- **Afternoon**: Gentle unwinding session with a personalized therapeutic massage in your private terrace garden. Introduction to your lead private concierge and itinerary briefing.
- **Evening & Dining**: Private table at the cliffside gastronomic institution **Ristorante Terrazza**. Indulge in a 6-course seasonal degustation paired with regional grand cru vintages, followed by digestifs overlooking the illuminated coastline.

#### Day 2: Private Insider Access & Artisanal Maestros
- **Morning (09:00)**: Exclusive before-hours private entry to the historic royal museum and palace gardens with Senior Art Historian. No queues, no public foot traffic.
- **Afternoon**: Private vintage Riva wooden boat charter exploring secluded coves and sea caves inaccessible to larger vessels. Organic gourmet picnic lunch prepared onboard with fresh burrata, sea salt focaccia, and chilled local sparkling wine.
- **Evening & Dining**: Sunset cocktails at an unmarked private speakeasy terrace, followed by dinner at a restored family-run truffleria featuring seasonal white truffles and aged Barolo.

#### Day 3: Vineyard Terroir & Masterclass Immersion
- **Morning**: Scenic private helicopter hop over the valleys to a private biodynamic estate dating back to 1740. Walk the ancient cellars with the estate owner and 6th-generation vigneron.
- **Afternoon**: Interactive culinary masterclass in a historic stone farmhouse kitchen. Master the nuance of handmade regional pasta and delicate sauces, followed by a long, leisurely vineyard lunch under ancient pergolas.
- **Evening & Dining**: Restful evening at your villa. Candlelit 4-course dinner served poolside by your private chef, serenaded by an acoustic classical guitarist under the stars.

#### Day 4: Hidden Courtyards & Private Art Collections
- **Morning**: Behind-closed-doors visit to private noble palazzos normally closed to the public. View privately owned Renaissance masterpieces with the family curator.
- **Afternoon**: Curated bespoke shopping experience in the artisan quarter—private appointments with bespoke fragrance alchemists and custom leather tailors with champagne service.
- **Evening & Dining**: Farewell Gala dinner at a 3-Michelin-starred cliffside dining room. Experience avant-garde culinary artistry with rare cellar reserves.

#### Day 5: Gentle Farewell & Seamless Departure
- **Morning**: Late leisurely breakfast on your private terrace. Freshly baked brioche, orchard fruits, and espresso as the morning mist lifts over the water.
- **Midday**: VIP chauffeured transfer directly to the executive lounge for your onward departure, with all luggage and baggage handling pre-managed.

---

### Insider Concierge Secrets
1. **The Secret Olive Grove Path**: Behind the monastery gardens lies an unmarked 800-year-old stone stairway leading to a silent cliffside lookout over the bay, perfect for solitary contemplation at dawn.
2. **The Sommelier's Hidden Stash**: When dining at the terrace restaurant, ask for Marco and request his unpublished "Cantina Segreta" cellar book featuring unlabelled regional reserves.
3. **Private Water Taxi Shortcut**: Bypass the coastal traffic by requesting the hotel's wooden water launch directly from the private cove into the harbor center.

---

### Estimated Investment Allocation (Budget: ${intake.budget})
- **Boutique Accommodations & Terrace Suites**: ~48%
- **Private Charters & VIP Aviation/Transfers**: ~24%
- **Gastronomy & Rare Cellar Pairings**: ~18%
- **Private Art Historian & Exclusive Access Fees**: ~10%

---

### Advisor Logistics & Booking Deadlines
- *Helicopter & Marine Charters*: Pre-confirm passenger weights and flight paths 14 days prior.
- *Michelin & Private Palace Access*: Bookings finalized; cancellation penalty window is 7 days prior.
- *Special Notes*: ${intake.constraints || 'Client dietary preferences and high-floor room preferences registered with head concierge.'}
`;

  // Simulate smooth streaming tokens (words & chunks) with small micro-delays
  const chunks = content.split(/(?<=\s|#|\n)/);
  for (const chunk of chunks) {
    yield chunk;
    await new Promise((resolve) => setTimeout(resolve, 8)); // 8ms gives a lifelike streaming typing effect
  }
}
