import type { APIRoute } from 'astro';
import { streamGenerateItinerary, DEFAULT_MODEL, DEFAULT_OLLAMA_HOST } from '../../lib/ollama';
import { getOrCreateClient, createItinerary } from '../../lib/db';
import type { TripIntake } from '../../lib/prompt';
import { marked } from 'marked';

export const POST: APIRoute = async ({ request }) => {
  let intake: TripIntake;
  let clientEmail = '';
  let model = DEFAULT_MODEL;
  let host = DEFAULT_OLLAMA_HOST;

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    clientEmail = body.clientEmail || '';
    model = body.model || DEFAULT_MODEL;
    host = body.host || DEFAULT_OLLAMA_HOST;
    intake = {
      clientName: body.clientName || 'Private VIP Client',
      vipTier: body.vipTier || 'Gold VIP',
      destination: body.destination || 'Amalfi Coast, Italy',
      startDate: body.startDate || '',
      endDate: body.endDate || '',
      durationDays: parseInt(body.durationDays || '5', 10),
      travelersCount: parseInt(body.travelersCount || '2', 10),
      budget: body.budget || '$15,000',
      pacing: body.pacing || 'Balanced',
      interests: Array.isArray(body.interests) ? body.interests : [body.interests].filter(Boolean),
      hotelPreference: body.hotelPreference || 'Boutique Heritage',
      constraints: body.constraints || '',
    };
  } else {
    // Form data (from HTMX hx-post)
    const formData = await request.formData();
    const rawInterests = formData.getAll('interests') as string[];
    clientEmail = (formData.get('clientEmail') as string) || '';
    model = (formData.get('model') as string) || DEFAULT_MODEL;
    host = (formData.get('host') as string) || DEFAULT_OLLAMA_HOST;

    intake = {
      clientName: (formData.get('clientName') as string) || 'Private VIP Client',
      vipTier: (formData.get('vipTier') as string) || 'Gold VIP',
      destination: (formData.get('destination') as string) || 'Amalfi Coast, Italy',
      startDate: (formData.get('startDate') as string) || '',
      endDate: (formData.get('endDate') as string) || '',
      durationDays: parseInt((formData.get('durationDays') as string) || '5', 10),
      travelersCount: parseInt((formData.get('travelersCount') as string) || '2', 10),
      budget: (formData.get('budget') as string) || '$15,000',
      pacing: (formData.get('pacing') as string) || 'Balanced',
      interests: rawInterests.length > 0 ? rawInterests : ['Culinary & Michelin Dining', 'Private Culture'],
      hotelPreference: (formData.get('hotelPreference') as string) || 'Boutique Heritage',
      constraints: (formData.get('constraints') as string) || '',
    };
  }

  // Generate full markdown via stream generator
  let fullMarkdown = '';
  for await (const chunk of streamGenerateItinerary(intake, model, host)) {
    fullMarkdown += chunk;
  }

  // Save to SQLite
  const client = getOrCreateClient(intake.clientName, clientEmail, '', intake.vipTier);
  const firstLine = fullMarkdown.split('\n').find((l) => l.trim().startsWith('#')) || '';
  const cleanTitle = firstLine.replace(/^[#\s*]+/, '').replace(/[*_#]/g, '').trim() || `${intake.destination} Curated Journey`;

  const saved = createItinerary({
    client_id: client.id,
    title: cleanTitle,
    destination: intake.destination,
    start_date: intake.startDate,
    end_date: intake.endDate,
    budget: intake.budget,
    travelers_count: intake.travelersCount,
    pacing: intake.pacing,
    interests: JSON.stringify(intake.interests),
    constraints: intake.constraints,
    hotel_preference: intake.hotelPreference,
    content_markdown: fullMarkdown,
    model_used: model,
    status: 'draft',
  });

  // Render HTML via marked
  const renderedHtml = await marked.parse(fullMarkdown);

  // Return HTMX partial response
  const responseHtml = `
    <div id="itinerary-result-card" class="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all duration-500 animate-fadeIn">
      <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Generated & Stored Locally
            </span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              ${intake.vipTier || 'VIP'}
            </span>
            <span class="text-xs text-slate-400">Model: ${model}</span>
          </div>
          <h2 class="text-2xl font-serif font-bold text-white tracking-tight">${cleanTitle}</h2>
          <p class="text-sm text-slate-400 mt-0.5">Guest: <strong class="text-slate-200">${intake.clientName}</strong> • ${intake.destination} • ${intake.budget}</p>
        </div>

        <div class="flex items-center gap-2">
          <a href="/itinerary/${saved.id}" class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            Present Client View
          </a>
          <button onclick="window.print()" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Print
          </button>
        </div>
      </div>

      <div class="prose prose-invert prose-amber max-w-none pt-6 prose-headings:font-serif prose-headings:text-amber-200/90 prose-h2:text-xl prose-h3:text-lg prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-amber-300">
        ${renderedHtml}
      </div>

      <div class="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          <span>Saved to local SQLite database (Record ID: #${saved.id}). No cloud telemetry.</span>
        </div>
        <div class="flex items-center gap-3">
          <a href="/" class="hover:text-amber-400 transition-colors">Return to Dashboard &rarr;</a>
        </div>
      </div>
    </div>
  `;

  return new Response(responseHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
};
