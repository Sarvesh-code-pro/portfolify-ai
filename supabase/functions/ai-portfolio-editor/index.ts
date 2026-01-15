import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PortfolioEditRequest {
  command: string;
  portfolio: {
    hero_title?: string;
    hero_subtitle?: string;
    about_text?: string;
    skills?: string[];
    experience?: any[];
    projects?: any[];
    testimonials?: any[];
    section_order?: string[];
    section_visibility?: Record<string, boolean>;
    section_titles?: Record<string, string>;
    template?: string;
    theme?: { primaryColor: string; backgroundColor: string; textColor: string };
    color_mode?: string;
    role?: string;
  };
}

const SYSTEM_PROMPT = `You are an expert portfolio editor and career consultant AI. You can make STRUCTURAL and CONTENT changes to portfolios.

CAPABILITIES:
1. REORDER SECTIONS - Change the order of portfolio sections
2. TOGGLE VISIBILITY - Show or hide sections
3. UPDATE TITLES - Change section display names
4. UPDATE CONTENT - Rewrite hero, about, skills, experience, projects, testimonials
5. UPDATE THEME - Change colors and color mode
6. CHANGE LAYOUT - Switch portfolio template
7. ADD SECTIONS - Create new custom sections

SECTION IDs: hero, about, skills, experience, projects, education, testimonials, certificates, contact

TEMPLATES: minimal, professional, creative, developer, elegant

USER INTENT MAPPING:
- "Make more creative" → Change template to creative, use vibrant colors, emphasize projects
- "More professional" → Use professional template, muted colors, emphasize experience
- "Focus on projects" → Reorder to put projects higher, hide less relevant sections
- "Senior-level tone" → Rewrite content with leadership language, quantified achievements
- "Move X above Y" → Reorder sections accordingly
- "Hide X" → Toggle section visibility to false
- "Make it shorter" → Hide less important sections, condense content

RESPONSE FORMAT:
You MUST call the apply_portfolio_changes function with your planned changes.
Include a summary explaining what you're doing and why.
Set confidence to "high" if the request is clear, "medium" if ambiguous, "low" if very uncertain.

WRITING STYLE:
- Use action verbs: Led, Built, Increased, Delivered, Architected, Spearheaded
- Be specific and quantifiable: "Reduced load time by 60%" not "Improved performance"
- Sound confident but authentic
- Match language to the user's career level and industry`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "apply_portfolio_changes",
      description: "Apply a structured set of changes to the portfolio. Call this with your edit plan.",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Brief explanation of changes being made (1-2 sentences)"
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Confidence in understanding the user's intent"
          },
          actions: {
            type: "array",
            description: "List of actions to apply",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: [
                    "reorder_sections",
                    "toggle_section_visibility", 
                    "update_section_title",
                    "update_content",
                    "update_theme",
                    "update_layout",
                    "add_section",
                    "batch_update"
                  ]
                },
                reasoning: {
                  type: "string",
                  description: "Why this action is being taken"
                },
                // For reorder_sections
                newOrder: {
                  type: "array",
                  items: { type: "string" },
                  description: "New order of section IDs"
                },
                // For toggle_section_visibility
                sectionId: {
                  type: "string",
                  description: "Section ID to modify"
                },
                visible: {
                  type: "boolean",
                  description: "Whether section should be visible"
                },
                // For update_section_title
                newTitle: {
                  type: "string",
                  description: "New title for the section"
                },
                // For update_content
                updates: {
                  type: "object",
                  properties: {
                    hero_title: { type: "string" },
                    hero_subtitle: { type: "string" },
                    about_text: { type: "string" },
                    skills: { 
                      type: "array", 
                      items: { type: "string" } 
                    },
                    experience: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          company: { type: "string" },
                          role: { type: "string" },
                          period: { type: "string" },
                          description: { type: "string" }
                        }
                      }
                    },
                    projects: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          technologies: { 
                            type: "array", 
                            items: { type: "string" } 
                          },
                          link: { type: "string" }
                        }
                      }
                    },
                    testimonials: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          role: { type: "string" },
                          company: { type: "string" },
                          content: { type: "string" }
                        }
                      }
                    }
                  }
                },
                // For update_theme
                theme: {
                  type: "object",
                  properties: {
                    primaryColor: { type: "string" },
                    backgroundColor: { type: "string" },
                    textColor: { type: "string" }
                  }
                },
                colorMode: {
                  type: "string",
                  enum: ["light", "dark"]
                },
                // For update_layout
                template: {
                  type: "string",
                  enum: ["minimal", "professional", "creative", "developer", "elegant"]
                },
                // For add_section
                title: {
                  type: "string",
                  description: "Title for new custom section"
                },
                content: {
                  type: "string",
                  description: "Content for new custom section"
                }
              },
              required: ["type"]
            }
          }
        },
        required: ["summary", "confidence", "actions"]
      }
    }
  }
];

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
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { command, portfolio }: PortfolioEditRequest = await req.json();

    if (!command || !command.trim()) {
      return new Response(
        JSON.stringify({ error: "Command is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("Service configuration error");
    }

    // Build context about the current portfolio
    const portfolioContext = `
CURRENT PORTFOLIO STATE:
- Role/Industry: ${portfolio.role || 'Not specified'}
- Template: ${portfolio.template || 'minimal'}
- Color Mode: ${portfolio.color_mode || 'dark'}
- Section Order: ${(portfolio.section_order || ['hero', 'about', 'skills', 'experience', 'projects']).join(' → ')}
- Hidden Sections: ${Object.entries(portfolio.section_visibility || {}).filter(([_, v]) => !v).map(([k]) => k).join(', ') || 'None'}

CONTENT SUMMARY:
- Hero: ${portfolio.hero_title || 'Not set'} | ${portfolio.hero_subtitle || 'Not set'}
- About: ${portfolio.about_text ? `${portfolio.about_text.slice(0, 100)}...` : 'Not set'}
- Skills: ${(portfolio.skills || []).slice(0, 5).join(', ')}${(portfolio.skills?.length || 0) > 5 ? '...' : ''}
- Experience: ${(portfolio.experience || []).length} entries
- Projects: ${(portfolio.projects || []).length} entries
- Testimonials: ${(portfolio.testimonials || []).length} entries
`;

    const userPrompt = `User Command: "${command}"

${portfolioContext}

FULL PORTFOLIO DATA:
${JSON.stringify(portfolio, null, 2)}

Analyze the user's command and apply appropriate structural and content changes. Be comprehensive - if they ask for a style change, also update content to match. If they want emphasis on something, reorder sections and possibly hide less relevant ones.`;

    console.log(`[ai-portfolio-editor] user=${user.id} command="${command.slice(0, 50)}..."`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        tools: TOOLS,
        tool_choice: { type: "function", function: { name: "apply_portfolio_changes" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI processing failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const plan = JSON.parse(toolCall.function.arguments);
    console.log(`[ai-portfolio-editor] Generated plan with ${plan.actions?.length || 0} actions, confidence: ${plan.confidence}`);

    return new Response(
      JSON.stringify({
        success: true,
        plan: {
          summary: plan.summary,
          confidence: plan.confidence,
          actions: plan.actions
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI portfolio editor error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to process request" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
