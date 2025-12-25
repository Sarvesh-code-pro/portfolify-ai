import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_RESUME_TEXT_LENGTH = 50000; // 50KB max
const MAX_BASE64_LENGTH = 5000000; // ~5MB for PDF

function getSafeErrorMessage(error: unknown): string {
  console.error("Full error details:", error);
  
  if (error instanceof Error) {
    if (error.message.includes("Rate limit") || error.message.includes("429")) {
      return "Too many requests. Please try again later.";
    }
    if (error.message.includes("credits") || error.message.includes("402")) {
      return "Service temporarily unavailable.";
    }
    if (error.message.includes("too long") || error.message.includes("Input")) {
      return error.message; // Safe to expose input validation errors
    }
    if (error.message.includes("No resume")) {
      return "No resume content provided.";
    }
  }
  return "Resume parsing failed. Please try again.";
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

    const { resumeText, resumeBase64 } = await req.json();
    
    // Input validation
    if (resumeText && typeof resumeText === "string" && resumeText.length > MAX_RESUME_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Resume text too long (max 50KB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (resumeBase64 && typeof resumeBase64 === "string" && resumeBase64.length > MAX_BASE64_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Resume file too large (max 5MB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("Missing required configuration: LOVABLE_API_KEY");
      throw new Error("Service configuration error");
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

    console.log("Calling AI to parse resume, user:", user.id, "textLength:", textContent.length);

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
          throw new Error("Could not parse response");
        }
      }
    }

    // Validate and sanitize output
    parsedData.rawText = textContent;
    
    // Ensure arrays exist and are within limits
    parsedData.skills = Array.isArray(parsedData.skills) ? parsedData.skills.slice(0, 100) : [];
    parsedData.projects = Array.isArray(parsedData.projects) ? parsedData.projects.slice(0, 50) : [];
    parsedData.experience = Array.isArray(parsedData.experience) ? parsedData.experience.slice(0, 50) : [];
    parsedData.education = Array.isArray(parsedData.education) ? parsedData.education.slice(0, 20) : [];
    parsedData.certifications = Array.isArray(parsedData.certifications) ? parsedData.certifications.slice(0, 50) : [];
    parsedData.achievements = Array.isArray(parsedData.achievements) ? parsedData.achievements.slice(0, 50) : [];
    parsedData.warnings = Array.isArray(parsedData.warnings) ? parsedData.warnings.slice(0, 20) : [];
    parsedData.unmappedSections = Array.isArray(parsedData.unmappedSections) ? parsedData.unmappedSections.slice(0, 20) : [];
    parsedData.extractedLinks = parsedData.extractedLinks || {};
    
    // Truncate long text fields
    if (parsedData.about && parsedData.about.length > 5000) {
      parsedData.about = parsedData.about.slice(0, 5000);
    }

    console.log("Resume parsed successfully for user:", user.id);
    console.log("- Detected role:", parsedData.detectedRole);
    console.log("- Skills count:", parsedData.skills.length);
    console.log("- Experience count:", parsedData.experience.length);

    return new Response(JSON.stringify(parsedData), {
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
