import type { APIRoute } from 'astro';
import { getClients, getOrCreateClient } from '../../lib/db';

export const GET: APIRoute = async () => {
  const clients = getClients();
  return new Response(JSON.stringify(clients), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  if (!body.name) {
    return new Response(JSON.stringify({ error: 'Name is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const client = getOrCreateClient(body.name, body.email, body.phone, body.vip_tier);
  return new Response(JSON.stringify(client), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
