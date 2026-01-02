import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_COMMAND_LENGTH = 1000;
const MAX_CONTENT_LENGTH = 50000;

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

function getSafeErrorMessage(error: unknown): string {
  console.error("Full error details:", error);
  
  if (error instanceof Error) {
    if (error.message.includes("Rate limit") || error.message.includes("429")) {
      return "Too many requests. Please try again later.";
    }
    if (error.message.includes("credits") || error.message.includes("402")) {
      return "Service temporarily unavailable.";
    }
    if (error.message.includes("too long") || error.message.includes("required")) {
      return error.message;
    }
  }
  return "Content editing failed. Please try again.";
}

const refinementCommands: Record<string, string> = {
  "make it more professional": "Enhance the language to sound more polished and professional while keeping the facts accurate.",
  "make it shorter": "Condense the content while preserving the key points and impact.",
  "make it more impactful": "Add stronger action verbs and emphasize achievements and measurable results.",
  "improve clarity": "Simplify the language and structure for better readability.",
  "add more detail": "Expand on the key points with specific examples and context.",
  "match role": "Adjust the tone and emphasis to better match the target professional role.",
};

const sectionInstructions: Record<string, string> = {
  hero: `For HERO section edits:
- Line 1: Name - Professional Title (e.g., "Sarah Chen - Senior Product Designer")
- Line 2: One powerful sentence (50-100 chars) summarizing unique value
- Return exactly 2 lines, no labels or extra formatting`,

  skills: `For SKILLS section edits:
- Return a comma-separated list of skills
- Order by relevance/importance
- No bullets, numbers, or JSON
- Example: "React, TypeScript, Node.js, AWS, System Design"`,

  about: `For ABOUT section edits:
- Return 2-3 paragraphs of polished prose
- Start with a hook, then expertise, then what drives them
- No quotes around the text
- Keep it authentic but professional`,

  experience: `For EXPERIENCE section edits:
- Preserve the structure: company, role, dates, description
- Enhance descriptions with action verbs and metrics
- Keep entries separated by blank lines
- Don't add or remove entries unless asked`,

  projects: `For PROJECTS section edits:
- Preserve the structure: title, description, technologies
- Enhance descriptions to show impact
- Keep entries separated by blank lines
- Don't add or remove entries unless asked`
};

// Detect if command is a refinement shortcut
function expandRefinementCommand(command: string): string {
  const lowerCommand = command.toLowerCase().trim();
  for (const [shortcut, expansion] of Object.entries(refinementCommands)) {
    if (lowerCommand.includes(shortcut)) {
      return expansion;
    }
  }
  return command;
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

    const { command: rawCommand, content, scope, sectionType, context }: EditRequest = await req.json();

    // Expand refinement shortcuts to full instructions
    const command = expandRefinementCommand(rawCommand);

    if (!rawCommand || !content) {
      return new Response(
        JSON.stringify({ error: "Command and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (typeof command === "string" && command.length > MAX_COMMAND_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Command too long (max 1KB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (typeof content === "string" && content.length > MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Content too long (max 50KB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("Missing required configuration: LOVABLE_API_KEY");
      throw new Error("Service configuration error");
    }

    console.log(
      `[ai-edit-content] user=${user.id} scope=${scope} section=${sectionType ?? "-"} cmdLen=${command.length} contentLen=${content.length}`
    );

    // For portfolio-scope edits, use tool calling for structured output
    if (scope === "portfolio") {
      const systemPrompt = `You are a professional portfolio editor. Apply the user's command to improve the portfolio content.

EDITING PRINCIPLES:
1. PRESERVE FACTS: Keep all dates, numbers, company names, and specific achievements
2. ENHANCE LANGUAGE: Use active voice, strong verbs, and professional tone
3. MAINTAIN STRUCTURE: Don't add/remove sections unless specifically asked
4. BE TARGETED: Only modify what the command asks for
5. ROLE CONTEXT: Target role is ${context?.role || "professional"}

Call the patch_portfolio function with only the fields that should be updated.`;

      const userPrompt = `Command: "${command}"

Current portfolio content:
${content}

Apply the command and return only the modified fields.`;

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
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "patch_portfolio",
                description: "Return updated portfolio fields. Only include fields that should change.",
                parameters: {
                  type: "object",
                  properties: {
                    hero_title: { type: "string", description: "Name - Title format" },
                    hero_subtitle: { type: "string", description: "One-sentence value proposition" },
                    about_text: { type: "string", description: "2-3 paragraph professional summary" },
                    skills: { type: "array", items: { type: "string" } },
                    experience: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          role: { type: "string" },
                          company: { type: "string" },
                          period: { type: "string" },
                          description: { type: "string" }
                        },
                        required: ["role", "company", "period", "description"]
                      }
                    },
                    projects: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          technologies: { type: "array", items: { type: "string" } },
                          link: { type: "string" }
                        },
                        required: ["title", "description"]
                      }
                    }
                  }
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "patch_portfolio" } }
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
            JSON.stringify({ error: "Service temporarily unavailable." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error("AI processing failed");
      }

      const data = await response.json();
      
      // Extract tool call arguments
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          const patchData = JSON.parse(toolCall.function.arguments);
          console.log("Portfolio patch generated for user:", user.id, "fields:", Object.keys(patchData));
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              editedContent: JSON.stringify(patchData),
              originalContent: content,
              command,
              isStructuredPatch: true,
              patchData
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (e) {
          console.error("Failed to parse tool call arguments:", e);
          throw new Error("Could not parse AI response");
        }
      }
      
      throw new Error("No structured response from AI");
    }

    // For section/selection scope, use plain text response
    const sectionGuide = sectionType && sectionInstructions[sectionType] 
      ? sectionInstructions[sectionType] 
      : "";

    const systemPrompt = `You are a professional content editor for portfolios. Apply the user's command precisely.

OUTPUT RULES:
- Return ONLY the edited content - no explanations, no markdown fences, no labels
- Preserve all factual information (names, dates, numbers, companies)
- Keep the format appropriate for the section type
- Use professional, recruiter-friendly language

${sectionGuide}

Context:
- Target role: ${context?.role || "professional"}
- Scope: ${scope}${sectionType ? ` (${sectionType})` : ""}`;

    const userPrompt = `Command: "${command}"

Content to edit:
${content}

Return ONLY the improved content.`;

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
          { role: "user", content: userPrompt },
        ],
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
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI processing failed");
    }

    const data = await response.json();
    let editedContent = data.choices?.[0]?.message?.content?.trim();

    if (!editedContent) {
      throw new Error("No content returned");
    }

    // Clean up any markdown formatting that might have slipped through
    editedContent = editedContent
      .replace(/^```(?:json|text)?\n?/gm, "")
      .replace(/\n?```$/gm, "")
      .trim();

    // Validate output length
    const safeEditedContent = editedContent.length > MAX_CONTENT_LENGTH 
      ? editedContent.slice(0, MAX_CONTENT_LENGTH)
      : editedContent;

    console.log("Content edited for user:", user.id, "section:", sectionType);

    return new Response(
      JSON.stringify({ 
        success: true, 
        editedContent: safeEditedContent,
        originalContent: content,
        command,
        isStructuredPatch: false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const safeMessage = getSafeErrorMessage(error);
    return new Response(
      JSON.stringify({ error: safeMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
