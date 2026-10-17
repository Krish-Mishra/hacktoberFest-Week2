import type { APIRoute } from 'astro';
import { deleteItinerary, updateItineraryStatus, getItineraryById } from '../../../lib/db';

export const GET: APIRoute = async ({ params }) => {
  const id = parseInt(params.id || '0', 10);
  const itinerary = getItineraryById(id);
  if (!itinerary) {
    return new Response(JSON.stringify({ error: 'Itinerary not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify(itinerary), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = parseInt(params.id || '0', 10);
  const success = deleteItinerary(id);
  if (success) {
    // Return 200 with empty string so HTMX swaps away the deleted element cleanly
    return new Response('', { status: 200 });
  } else {
    return new Response(JSON.stringify({ error: 'Failed to delete or not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = parseInt(params.id || '0', 10);
  const body = await request.json().catch(() => ({}));
  const status = body.status || 'finalized';
  const success = updateItineraryStatus(id, status);
  if (success) {
    return new Response(JSON.stringify({ success: true, status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    return new Response(JSON.stringify({ error: 'Failed to update' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
