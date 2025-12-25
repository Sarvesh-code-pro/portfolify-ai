import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    const { direction, portfolio, resumeText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!direction || !["resume_to_portfolio", "portfolio_to_resume"].includes(direction)) {
      throw new Error("Invalid sync direction");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (direction === "resume_to_portfolio") {
      // Update portfolio from new resume
      systemPrompt = `You are an expert at updating portfolio content from resume data. 
Given a new resume and existing portfolio, update the portfolio intelligently:
- Preserve the portfolio's tone and style
- Add new information from the resume
- Update outdated information
- Keep the role-specific focus

Return ONLY valid JSON with the updated portfolio structure:
{
  "heroTitle": "Name - Title",
  "heroSubtitle": "Tagline",
  "about": "About text",
  "skills": ["skill1", ...],
  "projects": [{"title": "", "description": "", "technologies": [], "link": ""}],
  "experience": [{"company": "", "role": "", "period": "", "description": ""}]
}`;

      userPrompt = `Current Portfolio:
${JSON.stringify(portfolio, null, 2)}

New Resume:
${resumeText}

Update the portfolio with information from the new resume while maintaining professional tone.`;
    } else {
      // Generate resume from portfolio
      systemPrompt = `You are an expert resume writer. Generate a professional resume text from portfolio content.
The resume should be:
- Formatted in clear sections (Summary, Experience, Skills, Projects, Education)
- Written in professional resume language
- Include bullet points for achievements
- Be ATS-friendly

Return ONLY valid JSON:
{
  "resumeText": "Full resume text with proper formatting using line breaks"
}`;

      userPrompt = `Generate a professional resume from this portfolio:
${JSON.stringify(portfolio, null, 2)}`;
    }

    console.log(`Syncing ${direction}...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI sync failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1].trim());
      } else {
        const jsonStart = content.indexOf("{");
        const jsonEnd = content.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          result = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse response");
        }
      }
    }

    console.log("Sync completed successfully");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Sync error:", error);
    const message = error instanceof Error ? error.message : "Sync failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
