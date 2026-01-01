import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_ROLES = [
  "developer",
  "designer",
  "product_manager",
  "data_scientist",
  "devops_engineer",
  "qa_engineer",
  "security_engineer",
  "mobile_developer",
  "ux_researcher",
  "content_writer",
  "marketing_manager",
  "brand_designer",
  "business_analyst",
  "project_manager",
  "sales_engineer",
  "consultant",
];

interface DetectRoleRequest {
  content: string;
  source: "resume" | "linkedin" | "text";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, source }: DetectRoleRequest = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No content provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Detecting role from ${source}, content length: ${content.length}`);

    // Use Lovable AI to detect role
    const response = await fetch("https://api.lovable.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a career role classifier. Analyze the provided profile/resume content and determine the most appropriate professional role.

Available roles (use EXACT string):
- developer: Software developers, engineers, programmers, full-stack/backend/frontend developers
- designer: UI/UX designers, graphic designers, visual designers
- product_manager: Product managers, product owners
- data_scientist: Data scientists, ML engineers, AI researchers, data analysts
- devops_engineer: DevOps engineers, SRE, platform engineers, infrastructure engineers
- qa_engineer: QA engineers, testers, quality analysts
- security_engineer: Security engineers, cybersecurity specialists, penetration testers
- mobile_developer: iOS/Android developers, React Native/Flutter developers
- ux_researcher: UX researchers, user researchers
- content_writer: Content writers, copywriters, technical writers
- marketing_manager: Marketing managers, digital marketers, growth marketers
- brand_designer: Brand designers, identity designers
- business_analyst: Business analysts, systems analysts
- project_manager: Project managers, scrum masters, agile coaches
- sales_engineer: Sales engineers, solutions engineers, pre-sales consultants
- consultant: Consultants, advisors, strategists

Respond with ONLY the role ID from the list above. If unsure, respond with "developer".`,
          },
          {
            role: "user",
            content: `Analyze this ${source} content and determine the professional role:\n\n${content.substring(0, 3000)}`,
          },
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    let detectedRole = aiResponse.choices[0]?.message?.content?.trim().toLowerCase() || "developer";

    // Validate role
    if (!VALID_ROLES.includes(detectedRole)) {
      console.log(`Invalid role detected: ${detectedRole}, defaulting to developer`);
      detectedRole = "developer";
    }

    console.log(`Detected role: ${detectedRole}`);

    return new Response(
      JSON.stringify({ 
        role: detectedRole,
        confidence: "high",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Role detection error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, role: "developer" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
