import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_PORTFOLIO_JSON_LENGTH = 100000; // 100KB max for portfolio JSON

function getSafeErrorMessage(error: unknown): string {
  console.error("Full error details:", error);
  
  if (error instanceof Error) {
    if (error.message.includes("Rate limit") || error.message.includes("429")) {
      return "Too many requests. Please try again later.";
    }
    if (error.message.includes("credits") || error.message.includes("402")) {
      return "Service temporarily unavailable.";
    }
    if (error.message.includes("too large") || error.message.includes("No portfolio")) {
      return error.message;
    }
  }
  return "Portfolio evaluation failed. Please try again.";
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
    if (requestBody.length > MAX_PORTFOLIO_JSON_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Portfolio data too large (max 100KB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { portfolio } = JSON.parse(requestBody);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("Missing required configuration: LOVABLE_API_KEY");
      throw new Error("Service configuration error");
    }

    if (!portfolio) {
      return new Response(
        JSON.stringify({ error: "No portfolio data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert portfolio reviewer and career coach. Evaluate the portfolio from a recruiter's perspective.

Score the portfolio from 0-100 based on:
- Completeness (all sections filled)
- Professional tone and clarity
- Impactful project descriptions
- Relevant skills highlighting
- Clear value proposition
- Call-to-actions and links

Return ONLY valid JSON with this structure:
{
  "score": 0-100,
  "summary": "One sentence overall assessment",
  "suggestions": [
    {
      "category": "projects" | "about" | "skills" | "experience" | "links" | "general",
      "priority": "high" | "medium" | "low",
      "suggestion": "Specific, actionable improvement"
    }
  ]
}

Be constructive but honest. Prioritize suggestions that will have the biggest impact.`;

    const portfolioSummary = `
Role: ${portfolio.role || "Not specified"}
Hero Title: ${portfolio.hero_title || "Not set"}
Hero Subtitle: ${portfolio.hero_subtitle || "Not set"}
About: ${portfolio.about_text ? `${portfolio.about_text.length} characters` : "Empty"}
Skills: ${Array.isArray(portfolio.skills) ? portfolio.skills.length : 0} skills listed
Projects: ${Array.isArray(portfolio.projects) ? portfolio.projects.length : 0} projects
Experience: ${Array.isArray(portfolio.experience) ? portfolio.experience.length : 0} entries
Links: GitHub: ${portfolio.links?.github ? "Yes" : "No"}, LinkedIn: ${portfolio.links?.linkedin ? "Yes" : "No"}, Website: ${portfolio.links?.website ? "Yes" : "No"}

Full Content:
${JSON.stringify(portfolio, null, 2)}
`;

    console.log("Evaluating portfolio for user:", user.id);

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
          { role: "user", content: `Evaluate this portfolio:\n\n${portfolioSummary}` }
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
      throw new Error("No evaluation generated");
    }

    let evaluation;
    try {
      evaluation = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[1].trim());
      } else {
        const jsonStart = content.indexOf("{");
        const jsonEnd = content.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          evaluation = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse response");
        }
      }
    }

    // Validate and sanitize output
    evaluation.score = typeof evaluation.score === "number" ? Math.min(100, Math.max(0, evaluation.score)) : 0;
    evaluation.suggestions = Array.isArray(evaluation.suggestions) ? evaluation.suggestions.slice(0, 20) : [];
    
    if (evaluation.summary && evaluation.summary.length > 500) {
      evaluation.summary = evaluation.summary.slice(0, 500);
    }

    console.log("Portfolio evaluated for user:", user.id, "score:", evaluation.score);

    return new Response(JSON.stringify(evaluation), {
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
