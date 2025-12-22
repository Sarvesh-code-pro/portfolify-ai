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
    const { role, mode, formData, prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const roleDescriptions: Record<string, string> = {
      developer: "software developer/engineer focusing on technical projects, code, and technology stack",
      designer: "designer focusing on visual work, case studies, and design process",
      product_manager: "product manager focusing on product launches, metrics, strategy, and leadership"
    };

    let userPrompt = "";
    
    if (mode === "form" && formData) {
      userPrompt = `Create a professional portfolio for a ${roleDescriptions[role]}.

Name: ${formData.fullName}
Title: ${formData.title}
About: ${formData.about}
Skills: ${formData.skills}
Projects: ${formData.projects}

Generate professional, recruiter-friendly content that sounds confident and accomplished. Make the language polished and impactful.`;
    } else if (mode === "prompt" && prompt) {
      userPrompt = `Create a professional portfolio for a ${roleDescriptions[role]} based on this description:

${prompt}

Generate professional, recruiter-friendly content that sounds confident and accomplished. Make the language polished and impactful.`;
    } else {
      throw new Error("Invalid input mode or missing data");
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
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    // Extract JSON from response
    let portfolioData;
    try {
      // Try to parse directly first
      portfolioData = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        portfolioData = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in the text
        const jsonStart = content.indexOf("{");
        const jsonEnd = content.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          portfolioData = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse AI response");
        }
      }
    }

    return new Response(JSON.stringify(portfolioData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Generate portfolio error:", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
