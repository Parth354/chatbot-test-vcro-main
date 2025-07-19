
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()
    const { id, linkedin_url } = record

    if (!linkedin_url) {
      return new Response(JSON.stringify({ error: 'Missing linkedin_url' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const makeWebhookUrl = Deno.env.get('VITE_MAKE_WEBHOOK_URL')
    if (!makeWebhookUrl) {
      throw new Error('VITE_MAKE_WEBHOOK_URL is not set')
    }

    const response = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agentId: id, linkedin_url }),
    })

    if (!response.ok) {
      throw new Error(`make.com webhook failed with status: ${response.status}`)
    }

    const persona = await response.json()

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { error } = await supabase
      .from('agents')
      .update({ persona })
      .eq('id', id)

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ success: true, persona }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
