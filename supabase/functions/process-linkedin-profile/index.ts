import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

console.log('Function started');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    const { record } = await req.json();
    const userId = record.user_id;
    const linkedinProfileUrl = record.linkedin_profile_url;

    if (!userId || !linkedinProfileUrl) {
      console.error('Missing userId or linkedinProfileUrl in payload');
      return new Response(JSON.stringify({ error: 'Missing userId or linkedinProfileUrl' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const makeWebhookUrl = 'https://hook.eu2.make.com/ys2r6910m793zwh91kweltjljqg5a4di'; // User provided URL

    const payload = {
      user_id: userId,
      linkedin_profile_url: linkedinProfileUrl,
    };

    console.log('Sending payload to Make.com:', payload);

    const response = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Make.com webhook failed: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ error: `Make.com webhook failed: ${response.status} - ${errorText}` }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('Successfully sent data to Make.com webhook.');
    return new Response(JSON.stringify({ message: 'Data sent to Make.com' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
