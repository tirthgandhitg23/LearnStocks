import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import yahooFinance from "npm:yahoo-finance2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json();

    if (!query) {
      // Return an empty array if the query is empty
      return new Response(JSON.stringify({ quotes: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Use the powerful search function from the library
    const searchResults = await yahooFinance.search(query, { newsCount: 0 }); // We don't need news results

    return new Response(JSON.stringify(searchResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})