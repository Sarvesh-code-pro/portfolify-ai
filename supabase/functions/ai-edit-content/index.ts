import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const systemPrompt = `You are a professional content editor for portfolios and resumes. Your task is to improve or rewrite content based on user commands.

IMPORTANT RULES:
1. Only output the improved content - no explanations, no markdown wrappers
2. Preserve the original meaning and key information
3. Match the professional tone expected for ${context?.role || "professional"} roles
4. Keep formatting consistent (bullets, structure)
5. Do not add information that wasn't in the original
6. If improving specific sections, maintain their purpose:
   - Summary/About: Professional summary, career highlights
   - Experience: Action verbs, quantifiable achievements
   - Skills: Technical and soft skills, relevant keywords
   - Projects: Clear descriptions of impact and technologies
   - Education: Degrees, institutions, relevant coursework

Current scope: ${scope}
${sectionType ? `Section type: ${sectionType}` : ""}

Apply the user's command to improve the content.`;

    const userPrompt = `Command: "${command}"

Content to edit:
${content}

Return ONLY the improved content, nothing else.`;

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
        temperature: 0.7,
        max_tokens: 2000,
      }),
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
