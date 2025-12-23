import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol, days, closePrices } = await req.json();
    const pythonApiUrl = 'http://172.30.144.1:8000/predict';
    let response;

    try {
      response = await fetch(pythonApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, days, closePrices }),
      });
    } catch (fetchError) {
      console.error('Error fetching Python API:', fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      return new Response(JSON.stringify({ error: `Could not connect to Python API. Is it running? Details: ${errorMessage}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 504,
      });
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Python API returned a non-2xx status: ${response.status}. Body: ${errorBody}`);
    }

    const predictionData = await response.json();

    return new Response(JSON.stringify(predictionData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('General function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})