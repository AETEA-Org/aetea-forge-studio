import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

const AETEA_API_URL = 'https://m-abdur2024-aetea-ai.hf.space';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AETEA_API_TOKEN = Deno.env.get('AETEA_API_TOKEN');
    if (!AETEA_API_TOKEN) {
      console.error('AETEA_API_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'API token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const path = url.searchParams.get('path');
    
    if (!path) {
      return new Response(
        JSON.stringify({ error: 'Missing path parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build target URL with query params
    const targetUrl = new URL(path, AETEA_API_URL);
    
    // Forward query params (except 'path')
    url.searchParams.forEach((value, key) => {
      if (key !== 'path') {
        targetUrl.searchParams.set(key, value);
      }
    });

    console.log(`Proxying ${req.method} request to: ${targetUrl.toString()}`);

    // Handle streaming for brief-analysis endpoint
    if (path === '/ai/brief-analysis' && req.method === 'POST') {
      const formData = await req.formData();
      
      const response = await fetch(targetUrl.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AETEA_API_TOKEN}`,
        },
        body: formData,
      });

      // Stream the response back
      return new Response(response.body, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle regular requests (GET, POST, PUT, PATCH, DELETE, etc.)
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${AETEA_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    // Add body for methods that typically have a body (POST, PUT, PATCH)
    // Skip for GET, HEAD, DELETE
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const body = await req.text();
      if (body) {
        fetchOptions.body = body;
      }
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);

    console.log(`Response status: ${response.status}`);

    // Handle empty responses (common with 204 No Content)
    const contentLength = response.headers.get('content-length');
    if (response.status === 204 || contentLength === '0') {
      return new Response(
        JSON.stringify({ success: true, message: 'Operation completed successfully' }), 
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Try to parse response - handle both JSON and text responses
    let data;
    try {
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        data = { success: true, message: 'Operation completed successfully' };
      } else {
        try {
          data = JSON.parse(text);
        } catch {
          // Not JSON, wrap the text
          data = { message: text };
        }
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      data = response.ok 
        ? { success: true, message: 'Operation completed successfully' } 
        : { error: 'Failed to parse response' };
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Proxy error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
