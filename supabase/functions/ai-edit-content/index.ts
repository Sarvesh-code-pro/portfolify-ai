import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EditRequest {
  command: string;
  content: string;
  scope: "selection" | "section" | "portfolio";
  sectionType?: string;
  context?: {
    role?: string;
    fullPortfolio?: any;
  };
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

    const { command, content, scope, sectionType, context }: EditRequest = await req.json();

    if (!command || !content) {
      return new Response(
        JSON.stringify({ error: "Command and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(
      `[ai-edit-content] scope=${scope} section=${sectionType ?? "-"} cmd=${JSON.stringify(
        command.slice(0, 80)
      )} contentLen=${content.length}`
    );

    const systemPrompt = `You are a professional content editor for portfolios and resumes. Apply the user's command to the provided content.

OUTPUT RULES (strict):
- Return ONLY the edited content. No explanations, no markdown, no code fences.
- Do NOT invent facts; keep the meaning and key details.
- Keep formatting simple and ATS-friendly.

SECTION FORMAT (when sectionType is provided):
- hero: return exactly 2 lines (line 1 = title, line 2 = subtitle). No labels.
- skills: return a comma-separated list of skills (no bullets, no JSON).
- about: return a single paragraph (no quotes).
- experience/projects: keep the same structure and keep entries separated by a blank line.

Context:
- Target role: ${context?.role || "professional"}
- Scope: ${scope}${sectionType ? ` | Section: ${sectionType}` : ""}`;

    const userPrompt = `Command: "${command}"

Content to edit:
${content}

Return ONLY the improved content, nothing else.`;

    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    };

    // For full-portfolio edits, force structured output via tool-calling so we never paste JSON into a text field.
    if (scope === "portfolio") {
      body.temperature = 0.4;
      body.tools = [
        {
          type: "function",
          function: {
            name: "patch_portfolio",
            description:
              "Return updated portfolio fields. Only include fields that should change based on the command.",
            parameters: {
              type: "object",
              properties: {
                hero_title: { type: "string" },
                hero_subtitle: { type: "string" },
                about_text: { type: "string" },
                skills: { type: "array", items: { type: "string" } },
                experience: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      role: { type: "string" },
                      company: { type: "string" },
                      period: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["role", "company", "period", "description"],
                    additionalProperties: false,
                  },
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
                        items: { type: "string" },
                      },
                      link: { type: "string" },
                    },
                    required: ["title", "description"],
                    additionalProperties: false,
                  },
                },
              },
              additionalProperties: false,
            },
          },
        },
      ];
      body.tool_choice = { type: "function", function: { name: "patch_portfolio" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const editedContent = data.choices?.[0]?.message?.content?.trim();

    if (!editedContent) {
      throw new Error("No content returned from AI");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        editedContent,
        originalContent: content,
        command
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-edit-content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
