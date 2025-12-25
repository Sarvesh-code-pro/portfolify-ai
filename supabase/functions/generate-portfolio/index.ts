import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
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

    const { role, mode, formData, prompt } = await req.json();
    
    // Input validation
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

    const roleDescriptions: Record<string, string> = {
      developer: "software developer/engineer focusing on technical projects, code, and technology stack",
      designer: "designer focusing on visual work, case studies, and design process",
      product_manager: "product manager focusing on product launches, metrics, strategy, and leadership"
    };

    let userPrompt = "";
    
    if (mode === "form" && formData) {
      userPrompt = `Create a professional portfolio for a ${roleDescriptions[role] || "professional"}.

Name: ${formData.fullName || ""}
Title: ${formData.title || ""}
About: ${formData.about || ""}
Skills: ${formData.skills || ""}
Projects: ${formData.projects || ""}

Generate professional, recruiter-friendly content that sounds confident and accomplished. Make the language polished and impactful.`;
    } else if (mode === "prompt" && prompt) {
      userPrompt = `Create a professional portfolio for a ${roleDescriptions[role] || "professional"} based on this description:

${prompt}

Generate professional, recruiter-friendly content that sounds confident and accomplished. Make the language polished and impactful.`;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid input mode or missing data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert portfolio content writer. Generate portfolio content in JSON format only. The content should be professional, confident, and recruiter-friendly. Avoid generic phrases. Make it specific and impactful.

Return ONLY valid JSON with this exact structure:
{
  "heroTitle": "Name - Professional Title",
  "heroSubtitle": "One impactful sentence about what they do",
  "about": "2-3 professional paragraphs about their experience and expertise",
  "skills": ["skill1", "skill2", "skill3", ...],
  "projects": [
    {
      "title": "Project Name",
      "description": "What the project does and impact",
      "technologies": ["tech1", "tech2"],
      "link": ""
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "period": "2020 - Present",
      "description": "What they accomplished"
    }
  ]
}`;

    console.log("Generating portfolio for user:", user.id, "mode:", mode);

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

    // Extract JSON from response
    let portfolioData;
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
