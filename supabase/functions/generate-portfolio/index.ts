import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_PROMPT_LENGTH = 5000;
const MAX_FORM_FIELD_LENGTH = 2000;

function getSafeErrorMessage(error: unknown): string {
  console.error("Full error details:", error);
  
  if (error instanceof Error) {
    if (error.message.includes("Rate limit") || error.message.includes("429")) {
      return "Too many requests. Please try again later.";
    }
    if (error.message.includes("credits") || error.message.includes("402")) {
      return "Service temporarily unavailable.";
    }
    if (error.message.includes("too long") || error.message.includes("Invalid input")) {
      return error.message;
    }
  }
  return "Portfolio generation failed. Please try again.";
}

const rolePrompts: Record<string, string> = {
  developer: `You are crafting a portfolio for a SOFTWARE DEVELOPER. Emphasize:
- Technical depth: Specific technologies, architectures, and systems built
- Impact metrics: Performance improvements, scale handled, bugs fixed
- Code quality: Testing practices, documentation, code reviews
- Problem-solving: Complex technical challenges overcome
- Collaboration: Cross-functional work, mentoring, open source contributions`,
  
  designer: `You are crafting a portfolio for a DESIGNER. Emphasize:
- Design process: Research, ideation, prototyping, iteration
- User-centered thinking: User research, usability testing, accessibility
- Visual craft: Typography, color theory, layout, motion design
- Business impact: Conversion improvements, user satisfaction metrics
- Tool proficiency: Design systems, prototyping tools, handoff processes`,
  
  product_manager: `You are crafting a portfolio for a PRODUCT MANAGER. Emphasize:
- Strategic thinking: Market analysis, competitive positioning, vision
- Execution excellence: Roadmap delivery, stakeholder alignment, prioritization
- Data-driven decisions: A/B testing, analytics, user research insights
- Cross-functional leadership: Engineering, design, marketing collaboration
- Business outcomes: Revenue growth, user acquisition, retention improvements`
};

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

    const { role, mode, formData, prompt } = await req.json();
    
    if (prompt && typeof prompt === "string" && prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Prompt too long (max 5KB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (formData) {
      const fields = ["fullName", "title", "about", "skills", "projects"];
      for (const field of fields) {
        if (formData[field] && typeof formData[field] === "string" && formData[field].length > MAX_FORM_FIELD_LENGTH) {
          return new Response(
            JSON.stringify({ error: `${field} is too long (max 2KB)` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("Missing required configuration: LOVABLE_API_KEY");
      throw new Error("Service configuration error");
    }

    const roleContext = rolePrompts[role] || rolePrompts.developer;

    let userPrompt = "";
    
    if (mode === "form" && formData) {
      userPrompt = `Create a portfolio based on this information:

Name: ${formData.fullName || ""}
Current Title: ${formData.title || ""}
Background: ${formData.about || ""}
Skills: ${formData.skills || ""}
Key Projects: ${formData.projects || ""}

Transform this into a compelling, recruiter-ready portfolio. Elevate the language to sound confident and accomplished while staying authentic to the provided information.`;
    } else if (mode === "prompt" && prompt) {
      userPrompt = `Create a portfolio based on this description:

${prompt}

Transform this into a compelling, recruiter-ready portfolio. Infer appropriate skills, projects, and experience based on the description. Make the content sound confident and accomplished.`;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid input mode or missing data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a professional portfolio writer who creates compelling content that gets interviews.

${roleContext}

WRITING PRINCIPLES:
1. LEAD WITH IMPACT: Start descriptions with results, not responsibilities
2. QUANTIFY EVERYTHING: Use numbers, percentages, timeframes wherever possible
3. ACTIVE VOICE: "Built", "Led", "Designed", "Launched" - not "Was responsible for"
4. AVOID CLICHÉS: No "passionate", "driven", "team player" - show, don't tell
5. SPECIFICITY: Name technologies, methodologies, and frameworks explicitly
6. RECRUITER-OPTIMIZED: Keywords that pass ATS and catch human attention

Call the generate_portfolio function with the complete portfolio content.`;

    console.log("Generating portfolio for user:", user.id, "mode:", mode, "role:", role);

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
        tools: [
          {
            type: "function",
            function: {
              name: "generate_portfolio",
              description: "Generate complete portfolio content optimized for recruiters",
              parameters: {
                type: "object",
                properties: {
                  heroTitle: { 
                    type: "string",
                    description: "Name - Professional Title (e.g., 'Alex Chen - Senior Product Designer')"
                  },
                  heroSubtitle: { 
                    type: "string",
                    description: "One powerful sentence capturing their unique value proposition (50-100 chars)"
                  },
                  about: { 
                    type: "string",
                    description: "2-3 paragraphs: opening hook, core expertise, what drives them. 200-400 words."
                  },
                  skills: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "8-15 most relevant skills, ordered by importance"
                  },
                  projects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { 
                          type: "string",
                          description: "2-3 sentences: what it is, what they did, what impact it had"
                        },
                        technologies: { type: "array", items: { type: "string" } },
                        link: { type: "string" }
                      },
                      required: ["title", "description", "technologies"]
                    },
                    description: "2-5 most impressive projects"
                  },
                  experience: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        company: { type: "string" },
                        role: { type: "string" },
                        period: { type: "string" },
                        description: { 
                          type: "string",
                          description: "3-5 bullet points as a single string, each starting with action verb and including metrics"
                        }
                      },
                      required: ["company", "role", "period", "description"]
                    }
                  }
                },
                required: ["heroTitle", "heroSubtitle", "about", "skills", "projects", "experience"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_portfolio" } }
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
    
    let portfolioData;
    
    // Handle tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        portfolioData = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
        throw new Error("Could not parse response");
      }
    } else {
      // Fallback to content parsing
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No content generated");
      }

      try {
        portfolioData = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          portfolioData = JSON.parse(jsonMatch[1].trim());
        } else {
          const jsonStart = content.indexOf("{");
          const jsonEnd = content.lastIndexOf("}");
          if (jsonStart !== -1 && jsonEnd !== -1) {
            portfolioData = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
          } else {
            throw new Error("Could not parse response");
          }
        }
      }
    }

    // Validate and sanitize output
    portfolioData.skills = Array.isArray(portfolioData.skills) ? portfolioData.skills.slice(0, 50) : [];
    portfolioData.projects = Array.isArray(portfolioData.projects) ? portfolioData.projects.slice(0, 20) : [];
    portfolioData.experience = Array.isArray(portfolioData.experience) ? portfolioData.experience.slice(0, 20) : [];
    
    if (portfolioData.about && portfolioData.about.length > 3000) {
      portfolioData.about = portfolioData.about.slice(0, 3000);
    }

    console.log("Portfolio generated successfully for user:", user.id);

    return new Response(JSON.stringify(portfolioData), {
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
