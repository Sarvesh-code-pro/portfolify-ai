import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_RESUME_TEXT_LENGTH = 50000; // 50KB
const MAX_PORTFOLIO_JSON_LENGTH = 100000; // 100KB

function getSafeErrorMessage(error: unknown): string {
  console.error("Full error details:", error);
  
  if (error instanceof Error) {
    if (error.message.includes("Rate limit") || error.message.includes("429")) {
      return "Too many requests. Please try again later.";
    }
    if (error.message.includes("credits") || error.message.includes("402")) {
      return "Service temporarily unavailable.";
    }
    if (error.message.includes("too long") || error.message.includes("Invalid sync")) {
      return error.message;
    }
  }
  return "Sync failed. Please try again.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
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

    const requestBody = await req.text();
    
    // Input validation - check raw body size
    if (requestBody.length > MAX_PORTFOLIO_JSON_LENGTH + MAX_RESUME_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Request data too large" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { direction, portfolio, resumeText } = JSON.parse(requestBody);
    
    // Validate inputs
    if (resumeText && typeof resumeText === "string" && resumeText.length > MAX_RESUME_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Resume text too long (max 50KB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("Missing required configuration: LOVABLE_API_KEY");
      throw new Error("Service configuration error");
    }

    if (!direction || !["resume_to_portfolio", "portfolio_to_resume"].includes(direction)) {
      return new Response(
        JSON.stringify({ error: "Invalid sync direction" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    console.log(`Syncing ${direction} for user:`, user.id);

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
        return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI processing failed");
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

    // Validate and sanitize output
    if (result.skills) {
      result.skills = Array.isArray(result.skills) ? result.skills.slice(0, 100) : [];
    }
    if (result.projects) {
      result.projects = Array.isArray(result.projects) ? result.projects.slice(0, 20) : [];
    }
    if (result.experience) {
      result.experience = Array.isArray(result.experience) ? result.experience.slice(0, 20) : [];
    }
    if (result.resumeText && result.resumeText.length > 50000) {
      result.resumeText = result.resumeText.slice(0, 50000);
    }

    console.log("Sync completed successfully for user:", user.id);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const safeMessage = getSafeErrorMessage(error);
    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
