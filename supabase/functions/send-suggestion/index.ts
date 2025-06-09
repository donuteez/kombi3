/*
  # Send Suggestion Email Function

  This Edge Function handles sending user suggestions via email using Resend.
  
  1. Functionality
    - Receives suggestion text and optional user email
    - Sends formatted email to doug@d3x.com
    - Returns success/error response
  
  2. Security
    - Uses RESEND_API_KEY from Supabase secrets
    - Validates input data
    - Handles CORS properly
*/

import { corsHeaders } from '../_shared/cors.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface SuggestionRequest {
  suggestion: string;
  userEmail?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { suggestion, userEmail }: SuggestionRequest = await req.json();

    if (!suggestion || suggestion.trim().length === 0) {
      throw new Error('Suggestion text is required');
    }

    // Prepare email content
    const emailHtml = `
      <h2>New Suggestion from Worx Notes</h2>
      <p><strong>Suggestion:</strong></p>
      <p>${suggestion.replace(/\n/g, '<br>')}</p>
      ${userEmail ? `<p><strong>User Email:</strong> ${userEmail}</p>` : '<p><em>No contact email provided</em></p>'}
      <hr>
      <p><small>Sent from Worx Notes application at ${new Date().toLocaleString()}</small></p>
    `;

    const emailText = `
New Suggestion from Worx Notes

Suggestion:
${suggestion}

${userEmail ? `User Email: ${userEmail}` : 'No contact email provided'}

---
Sent from Worx Notes application at ${new Date().toLocaleString()}
    `;

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Worx Notes <noreply@resend.dev>',
        to: ['doug@d3x.com'],
        subject: 'New Suggestion from Worx Notes',
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorData}`);
    }

    const result = await resendResponse.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Suggestion sent successfully',
        id: result.id 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Error sending suggestion:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});