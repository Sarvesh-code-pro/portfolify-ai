import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'LinkedIn URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate LinkedIn URL
    const linkedinUrlPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?/i;
    if (!linkedinUrlPattern.test(url)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please provide a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured. Please enable it in project settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping LinkedIn URL:', url);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url.trim(),
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Firecrawl API error:', data);
      
      // LinkedIn is not supported by Firecrawl
      const errorMsg = data.error || '';
      if (errorMsg.includes('not currently supported') || errorMsg.includes('blocked') || response.status === 403) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'LinkedIn profiles cannot be scraped directly due to their security restrictions. Please use the "Paste Text" tab and copy your profile content from LinkedIn instead.',
            fallbackToPaste: true
          }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the markdown content
    const markdown = data.data?.markdown || data.markdown || '';
    
    if (!markdown || markdown.length < 100) {
      console.log('Insufficient content scraped, length:', markdown.length);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract enough content from the LinkedIn profile. Please try the manual paste option.' 
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('LinkedIn scrape successful, content length:', markdown.length);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        content: markdown,
        metadata: data.data?.metadata || data.metadata
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping LinkedIn:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape LinkedIn profile';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
