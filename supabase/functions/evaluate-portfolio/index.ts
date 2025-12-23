import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { portfolio } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!portfolio) {
      throw new Error("No portfolio data provided");
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
Role: ${portfolio.role}
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

    console.log("Evaluating portfolio quality...");

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
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI evaluation failed");
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
          throw new Error("Could not parse evaluation response");
        }
      }
    }

    console.log("Portfolio evaluated, score:", evaluation.score);

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Evaluate portfolio error:", error);
    const message = error instanceof Error ? error.message : "Evaluation failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
