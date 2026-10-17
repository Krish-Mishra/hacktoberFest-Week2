import type { APIRoute } from 'astro';
import { streamGenerateItinerary, DEFAULT_MODEL, DEFAULT_OLLAMA_HOST } from '../../lib/ollama';
import { getOrCreateClient, createItinerary } from '../../lib/db';
import type { TripIntake } from '../../lib/prompt';

export const GET: APIRoute = async ({ request, url }) => {
  const params = url.searchParams;

  const clientName = params.get('clientName') || 'Private VIP Client';
  const clientEmail = params.get('clientEmail') || '';
  const vipTier = params.get('vipTier') || 'Gold VIP';
  const destination = params.get('destination') || 'Amalfi Coast, Italy';
  const startDate = params.get('startDate') || '';
  const endDate = params.get('endDate') || '';
  const durationDays = parseInt(params.get('durationDays') || '5', 10);
  const travelersCount = parseInt(params.get('travelersCount') || '2', 10);
  const budget = params.get('budget') || '$15,000';
  const pacing = params.get('pacing') || 'Balanced';
  const hotelPreference = params.get('hotelPreference') || 'Boutique Heritage & Luxury';
  const constraints = params.get('constraints') || '';
  const model = params.get('model') || DEFAULT_MODEL;
  const host = params.get('host') || DEFAULT_OLLAMA_HOST;

  let interests: string[] = [];
  try {
    const rawInterests = params.get('interests');
    if (rawInterests) {
      interests = rawInterests.startsWith('[') ? JSON.parse(rawInterests) : rawInterests.split(',').map((s) => s.trim());
    }
  } catch {
    interests = ['Culture', 'Fine Dining'];
  }

  const intake: TripIntake = {
    clientName,
    vipTier,
    destination,
    startDate,
    endDate,
    durationDays,
    travelersCount,
    budget,
    pacing,
    interests,
    hotelPreference,
    constraints,
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullContent = '';

      try {
        // Announce start
        controller.enqueue(encoder.encode(`event: start\ndata: ${JSON.stringify({ status: 'generating', destination, clientName })}\n\n`));

        for await (const chunk of streamGenerateItinerary(intake, model, host)) {
          fullContent += chunk;
          controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`));
        }

        // Save to SQLite local database
        let savedId = null;
        try {
          const client = getOrCreateClient(clientName, clientEmail, '', vipTier);
          
          // Extract a descriptive title from content or fallback
          const firstLine = fullContent.split('\n').find((l) => l.trim().startsWith('#')) || '';
          const cleanTitle = firstLine.replace(/^[#\s*]+/, '').replace(/[*_#]/g, '').trim() || `${destination} Curated Journey`;

          const savedItinerary = createItinerary({
            client_id: client.id,
            title: cleanTitle,
            destination,
            start_date: startDate,
            end_date: endDate,
            budget,
            travelers_count: travelersCount,
            pacing,
            interests: JSON.stringify(interests),
            constraints,
            hotel_preference: hotelPreference,
            content_markdown: fullContent,
            model_used: model,
            status: 'draft',
          });
          savedId = savedItinerary.id;
        } catch (dbErr) {
          console.error('Failed to auto-save itinerary to SQLite:', dbErr);
        }

        // Announce completion
        controller.enqueue(
          encoder.encode(
            `event: complete\ndata: ${JSON.stringify({
              status: 'done',
              id: savedId,
              clientName,
              destination,
            })}\n\n`
          )
        );

        controller.enqueue(encoder.encode(`event: done\ndata: [DONE]\n\n`));
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: err.message || 'Stream generation failed' })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering
    },
  });
};
