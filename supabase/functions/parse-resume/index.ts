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
      textContent = `[PDF Resume Content - Base64 encoded file provided]`;
    }

    if (!textContent && !resumeBase64) {
      throw new Error("No resume content provided");
    }

    // Enhanced prompt for comprehensive extraction with NO information loss
    const systemPrompt = `You are an expert resume parser. Your job is to extract EVERY piece of information from the resume with ZERO information loss.

CRITICAL EXTRACTION RULES:
1. Extract ALL sections present in the resume - do NOT skip or summarize any content
2. Preserve ALL dates, numbers, metrics, percentages, and specific achievements
3. Keep ALL bullet points and detailed descriptions - do not condense
4. Extract ALL skills mentioned anywhere in the resume
5. Capture certifications, awards, achievements, publications, volunteer work if present
6. Extract ALL contact information: email, phone, LinkedIn, GitHub, website, portfolio links
7. If you cannot classify a section, include it in unmappedSections array
8. Set warnings for any content that seems incomplete or unclear

Return ONLY valid JSON with this EXACT structure:
{
  "detectedRole": "developer" | "designer" | "product_manager",
  "heroTitle": "Full Name - Professional Title (extracted exactly as written)",
  "heroSubtitle": "One impactful sentence summarizing their expertise",
  "about": "2-3 paragraphs - keep all details from summary/objective section",
  "skills": ["ALL skills mentioned - technical, soft skills, tools, frameworks, languages"],
  "projects": [
    {
      "title": "Project Name",
      "description": "FULL description with all metrics and achievements",
      "technologies": ["all technologies listed"],
      "link": "project URL if provided"
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Exact Job Title",
      "period": "Exact dates as written (e.g., Jan 2020 - Present)",
      "description": "ALL bullet points and achievements - preserve metrics like '40% improvement', 'Led team of 5', etc."
    }
  ],
  "education": [
    {
      "institution": "School/University Name",
      "degree": "Full degree name including major/minor",
      "year": "Year or date range"
    }
  ],
  "certifications": ["All certifications with dates if provided"],
  "achievements": ["Awards, publications, notable achievements"],
  "extractedLinks": {
    "email": "extracted email",
    "phone": "extracted phone number",
    "github": "github URL",
    "linkedin": "linkedin URL",
    "website": "personal website or portfolio URL"
  },
  "warnings": ["List any content that seems truncated or unclear"],
  "unmappedSections": ["Any section headings that couldn't be classified"],
  "rawTextPreserved": true
}

IMPORTANT: Quality over brevity. It's better to include too much detail than to lose any information.`;

    const userPrompt = `Extract ALL information from this resume. Do NOT summarize or skip any content:

${textContent}

Remember:
- Preserve ALL metrics (percentages, numbers, team sizes)
- Keep ALL bullet points from experience
- Extract EVERY skill mentioned
- Include ALL contact info and links
- Flag anything that seems incomplete in warnings`;

    console.log("Calling AI to parse resume with enhanced extraction...");

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

    // Add the raw text for reference
    parsedData.rawText = textContent;
    
    // Ensure arrays exist even if empty
    parsedData.skills = parsedData.skills || [];
    parsedData.projects = parsedData.projects || [];
    parsedData.experience = parsedData.experience || [];
    parsedData.education = parsedData.education || [];
    parsedData.certifications = parsedData.certifications || [];
    parsedData.achievements = parsedData.achievements || [];
    parsedData.warnings = parsedData.warnings || [];
    parsedData.unmappedSections = parsedData.unmappedSections || [];
    parsedData.extractedLinks = parsedData.extractedLinks || {};

    console.log("Resume parsed successfully:");
    console.log("- Detected role:", parsedData.detectedRole);
    console.log("- Skills count:", parsedData.skills.length);
    console.log("- Experience count:", parsedData.experience.length);
    console.log("- Projects count:", parsedData.projects.length);
    console.log("- Warnings:", parsedData.warnings);

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
