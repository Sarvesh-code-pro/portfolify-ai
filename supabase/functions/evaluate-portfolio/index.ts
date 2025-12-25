import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_PORTFOLIO_JSON_LENGTH = 100000;

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

    const systemPrompt = `You are a senior technical recruiter and career coach with 15+ years of experience. Evaluate this portfolio as if you're deciding whether to advance this candidate.

SCORING CRITERIA (100 points total):

FIRST IMPRESSION (25 pts)
- Hero section clarity and hook
- Professional positioning
- Immediate value proposition

CONTENT QUALITY (25 pts)
- Writing quality (active voice, specificity, no clichés)
- Quantified achievements and metrics
- Authentic voice vs generic language

COMPLETENESS (20 pts)
- All key sections present and substantive
- Appropriate depth for each section
- No obvious gaps or missing context

PROFESSIONAL PRESENCE (15 pts)
- Contact links (GitHub, LinkedIn, portfolio)
- Project links and demos
- Easy to verify claims

ROLE FIT (15 pts)
- Skills aligned with role
- Experience relevance
- Clear career trajectory

EVALUATION APPROACH:
1. Score strictly - most portfolios should be 40-70
2. 80+ is excellent and rare
3. Below 40 indicates significant gaps
4. Prioritize suggestions that have the highest impact
5. Be specific - "Add 2-3 more projects" not "Add more content"

Call the evaluate_portfolio function with your assessment.`;

    const portfolioContent = `
Role: ${portfolio.role || "Not specified"}
Hero Title: ${portfolio.hero_title || "Not set"}
Hero Subtitle: ${portfolio.hero_subtitle || "Not set"}
About (${portfolio.about_text?.length || 0} chars): ${portfolio.about_text?.slice(0, 500) || "Empty"}
Skills (${Array.isArray(portfolio.skills) ? portfolio.skills.length : 0}): ${Array.isArray(portfolio.skills) ? portfolio.skills.slice(0, 15).join(", ") : "None"}
Projects (${Array.isArray(portfolio.projects) ? portfolio.projects.length : 0}): ${Array.isArray(portfolio.projects) ? portfolio.projects.map((p: any) => p.title).join(", ") : "None"}
Experience (${Array.isArray(portfolio.experience) ? portfolio.experience.length : 0}): ${Array.isArray(portfolio.experience) ? portfolio.experience.map((e: any) => `${e.role} at ${e.company}`).join(", ") : "None"}
Links: GitHub: ${portfolio.links?.github ? "✓" : "✗"}, LinkedIn: ${portfolio.links?.linkedin ? "✓" : "✗"}, Website: ${portfolio.links?.website ? "✓" : "✗"}

Full Portfolio Data:
${JSON.stringify(portfolio, null, 2)}`;

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
          { role: "user", content: `Evaluate this portfolio:\n\n${portfolioContent}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "evaluate_portfolio",
              description: "Provide structured portfolio evaluation with score and actionable suggestions",
              parameters: {
                type: "object",
                properties: {
                  score: { 
                    type: "number",
                    description: "Overall score 0-100 based on the weighted criteria"
                  },
                  summary: { 
                    type: "string",
                    description: "One sentence capturing the portfolio's strongest point and biggest gap"
                  },
                  breakdown: {
                    type: "object",
                    properties: {
                      firstImpression: { type: "number", description: "Score out of 25" },
                      contentQuality: { type: "number", description: "Score out of 25" },
                      completeness: { type: "number", description: "Score out of 20" },
                      professionalPresence: { type: "number", description: "Score out of 15" },
                      roleFit: { type: "number", description: "Score out of 15" }
                    }
                  },
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { 
                          type: "string",
                          enum: ["projects", "about", "skills", "experience", "links", "general"]
                        },
                        priority: { 
                          type: "string",
                          enum: ["high", "medium", "low"]
                        },
                        suggestion: { 
                          type: "string",
                          description: "Specific, actionable improvement with concrete example if applicable"
                        },
                        impact: {
                          type: "string",
                          description: "Brief explanation of how this improves their chances"
                        }
                      },
                      required: ["category", "priority", "suggestion"]
                    },
                    description: "3-7 prioritized suggestions, most impactful first"
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 things they're doing well (for encouragement)"
                  }
                },
                required: ["score", "summary", "suggestions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "evaluate_portfolio" } }
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
    
    let evaluation;
    
    // Handle tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        evaluation = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
        throw new Error("Could not parse response");
      }
    } else {
      // Fallback to content parsing
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No evaluation generated");
      }

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
    }

    // Validate and sanitize output
    evaluation.score = typeof evaluation.score === "number" ? Math.min(100, Math.max(0, Math.round(evaluation.score))) : 0;
    evaluation.suggestions = Array.isArray(evaluation.suggestions) ? evaluation.suggestions.slice(0, 10) : [];
    evaluation.strengths = Array.isArray(evaluation.strengths) ? evaluation.strengths.slice(0, 5) : [];
    
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
