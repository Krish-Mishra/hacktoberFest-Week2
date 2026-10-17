import type { APIRoute } from 'astro';
import { checkOllamaStatus, DEFAULT_OLLAMA_HOST } from '../../lib/ollama';
import { getDashboardStats } from '../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  const host = url.searchParams.get('host') || DEFAULT_OLLAMA_HOST;
  const ollamaStatus = await checkOllamaStatus(host);
  const stats = getDashboardStats();

  return new Response(JSON.stringify({
    ollama: ollamaStatus,
    db: {
      connected: true,
      ...stats,
    },
    timestamp: new Date().toISOString(),
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
};
