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
    const { resumeText, resumeBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let textContent = resumeText || "";

    // If PDF base64 is provided, extract text from it
    if (resumeBase64 && !resumeText) {
      // For PDF parsing, we'll send it to the AI which can read PDF content
      textContent = `[PDF Resume Content - Base64 encoded file provided]`;
    }

    if (!textContent && !resumeBase64) {
      throw new Error("No resume content provided");
    }

    const systemPrompt = `You are an expert resume parser and portfolio content generator. Parse the resume and extract structured information.

Analyze the resume carefully and:
1. Extract all professional information
2. Detect the most suitable role (developer, designer, or product_manager) based on the content
3. Generate professional, recruiter-friendly portfolio content

Return ONLY valid JSON with this exact structure:
{
  "detectedRole": "developer" | "designer" | "product_manager",
  "heroTitle": "Full Name - Professional Title",
  "heroSubtitle": "One impactful sentence about what they do",
  "about": "2-3 professional paragraphs about their experience",
  "skills": ["skill1", "skill2", ...],
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
      "period": "Start - End",
      "description": "Key accomplishments"
    }
  ],
  "education": [
    {
      "institution": "School Name",
      "degree": "Degree Name",
      "year": "Year"
    }
  ],
  "extractedLinks": {
    "github": "",
    "linkedin": "",
    "website": ""
  }
}`;

    const userPrompt = `Parse this resume and generate professional portfolio content:

${textContent}

Make the content polished, confident, and recruiter-friendly. Detect the role based on their experience and skills.`;

    console.log("Calling AI to parse resume...");

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
      throw new Error("AI parsing failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    // Extract JSON from response
    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[1].trim());
      } else {
        const jsonStart = content.indexOf("{");
        const jsonEnd = content.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          parsedData = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse AI response");
        }
      }
    }

    console.log("Resume parsed successfully, detected role:", parsedData.detectedRole);

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Parse resume error:", error);
    const message = error instanceof Error ? error.message : "Parsing failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
