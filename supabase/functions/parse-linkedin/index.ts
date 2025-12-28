import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_TEXT_LENGTH = 100000;

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
      return error.message;
    }
  }
  return "LinkedIn parsing failed. Please try again.";
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

    const { linkedinText } = await req.json();
    
    if (!linkedinText || typeof linkedinText !== "string") {
      return new Response(
        JSON.stringify({ error: "LinkedIn profile text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (linkedinText.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: "LinkedIn text too long (max 100KB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("Missing required configuration: LOVABLE_API_KEY");
      throw new Error("Service configuration error");
    }

    const systemPrompt = `You are an expert at parsing LinkedIn profile exports. Extract professional information from the LinkedIn PDF export text provided.

EXTRACTION RULES:
1. PRESERVE ALL DATA: Keep exact dates, numbers, metrics, and descriptions
2. MAINTAIN CHRONOLOGICAL ORDER: Experience and education should be in reverse chronological order
3. EXTRACT COMPLETE DESCRIPTIONS: Every bullet point and achievement
4. IDENTIFY ROLE FIT: Analyze the profile to determine best-fit role category

ROLE DETECTION CRITERIA:
TECH ROLES:
- "developer": Software engineering, backend/frontend development, full-stack, web development
- "data_scientist": Machine learning, AI, data analysis, statistics, research, analytics
- "devops_engineer": Infrastructure, CI/CD, cloud ops, SRE, platform engineering
- "qa_engineer": Testing, QA, automation, quality assurance, test engineering
- "security_engineer": Cybersecurity, penetration testing, security audits, compliance
- "mobile_developer": iOS, Android, React Native, Flutter, mobile app development

CREATIVE ROLES:
- "designer": UI/UX, product design, visual design, interaction design
- "ux_researcher": User research, usability testing, user interviews, research methods
- "content_writer": Copywriting, technical writing, content strategy, blogging
- "marketing_manager": Digital marketing, growth, campaigns, brand marketing
- "brand_designer": Brand identity, visual branding, logo design, style guides

BUSINESS ROLES:
- "product_manager": Product strategy, roadmaps, stakeholder management, agile leadership
- "business_analyst": Business analysis, requirements, process improvement
- "project_manager": Project management, PMO, Scrum Master, delivery management
- "sales_engineer": Technical sales, solutions engineering, pre-sales, demos
- "consultant": Management consulting, strategy consulting, advisory

Call the extract_linkedin_data function with all parsed information.`;

    const userPrompt = `Parse this LinkedIn profile export. Extract all professional information:

${linkedinText}

Remember: Preserve all metrics, achievements, and specific details exactly as written.`;

    console.log("Calling AI to parse LinkedIn profile, user:", user.id, "textLength:", linkedinText.length);

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
        tools: [
          {
            type: "function",
            function: {
              name: "extract_linkedin_data",
              description: "Extract and structure LinkedIn profile information",
              parameters: {
                type: "object",
                properties: {
                  detectedRole: { 
                    type: "string", 
                    enum: [
                      "developer", "data_scientist", "devops_engineer", "qa_engineer", "security_engineer", "mobile_developer",
                      "designer", "ux_researcher", "content_writer", "marketing_manager", "brand_designer",
                      "product_manager", "business_analyst", "project_manager", "sales_engineer", "consultant"
                    ],
                    description: "Best-fit role based on experience and skills"
                  },
                  heroTitle: { 
                    type: "string",
                    description: "Full name with professional title (e.g., 'Jane Doe - Senior Software Engineer')"
                  },
                  heroSubtitle: { 
                    type: "string",
                    description: "LinkedIn headline or one compelling sentence"
                  },
                  about: { 
                    type: "string",
                    description: "About/Summary section from LinkedIn profile"
                  },
                  skills: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "All skills listed on the profile"
                  },
                  experience: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        company: { type: "string" },
                        role: { type: "string" },
                        period: { type: "string", description: "Exact dates as written" },
                        description: { type: "string", description: "All bullet points and achievements" },
                        logo: { type: "string", description: "Company logo URL if available" }
                      },
                      required: ["company", "role", "period", "description"]
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
                  },
                  education: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        institution: { type: "string" },
                        degree: { type: "string" },
                        year: { type: "string" },
                        activities: { type: "string" }
                      },
                      required: ["institution", "degree", "year"]
                    }
                  },
                  certifications: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Licenses and certifications"
                  },
                  achievements: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Honors, awards, publications"
                  },
                  extractedLinks: {
                    type: "object",
                    properties: {
                      email: { type: "string" },
                      linkedin: { type: "string" },
                      website: { type: "string" },
                      github: { type: "string" },
                      twitter: { type: "string" },
                      location: { type: "string" }
                    }
                  },
                  profilePhotoUrl: {
                    type: "string",
                    description: "Profile photo URL if found in the export"
                  },
                  warnings: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Any unclear or incomplete information"
                  }
                },
                required: ["detectedRole", "heroTitle", "heroSubtitle", "about", "skills", "experience"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_linkedin_data" } }
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
    
    let parsedData;
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        parsedData = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
        throw new Error("Could not parse response");
      }
    } else {
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No content generated");
      }
      
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
    }

    // Validate and sanitize arrays
    parsedData.rawText = linkedinText;
    parsedData.source = "linkedin";
    parsedData.skills = Array.isArray(parsedData.skills) ? parsedData.skills.slice(0, 100) : [];
    parsedData.projects = Array.isArray(parsedData.projects) ? parsedData.projects.slice(0, 50) : [];
    parsedData.experience = Array.isArray(parsedData.experience) ? parsedData.experience.slice(0, 50) : [];
    parsedData.education = Array.isArray(parsedData.education) ? parsedData.education.slice(0, 20) : [];
    parsedData.certifications = Array.isArray(parsedData.certifications) ? parsedData.certifications.slice(0, 50) : [];
    parsedData.achievements = Array.isArray(parsedData.achievements) ? parsedData.achievements.slice(0, 50) : [];
    parsedData.warnings = Array.isArray(parsedData.warnings) ? parsedData.warnings.slice(0, 20) : [];
    parsedData.extractedLinks = parsedData.extractedLinks || {};
    
    if (parsedData.about && parsedData.about.length > 5000) {
      parsedData.about = parsedData.about.slice(0, 5000);
    }

    console.log("LinkedIn profile parsed successfully for user:", user.id);
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
