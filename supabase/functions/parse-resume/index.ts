import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_RESUME_TEXT_LENGTH = 50000;
const MAX_BASE64_LENGTH = 5000000;

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

    if (resumeBase64 && !resumeText) {
      textContent = `[PDF Resume Content - Base64 encoded file provided]`;
    }

    if (!textContent && !resumeBase64) {
      throw new Error("No resume content provided");
    }

    const systemPrompt = `You are a senior talent acquisition specialist and resume analyst. Parse the resume with meticulous attention to detail.

EXTRACTION PRINCIPLES:
1. PRESERVE ALL QUANTIFIABLE DATA: Numbers, percentages, dollar amounts, team sizes, timeframes
2. MAINTAIN CHRONOLOGICAL ACCURACY: Exact dates as written (e.g., "Jan 2020 - Present", "2019-2022")
3. CAPTURE COMPLETE DESCRIPTIONS: Every bullet point, achievement, and responsibility
4. EXTRACT ALL CONTACT INFO: Email, phone, LinkedIn, GitHub, portfolio URLs, location
5. IDENTIFY ROLE FIT: Analyze the overall profile to determine best-fit role category

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

Call the extract_resume_data function with all parsed information.`;

    const userPrompt = `Parse this resume completely. Extract every detail without summarizing:

${textContent}

Remember: Preserve all metrics, achievements, and specific details exactly as written.`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "extract_resume_data",
              description: "Extract and structure all resume information with complete fidelity",
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
                    description: "One compelling sentence summarizing expertise and value proposition"
                  },
                  about: { 
                    type: "string",
                    description: "Professional summary/objective - preserve all original content"
                  },
                  skills: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "ALL skills: technical, tools, frameworks, languages, soft skills"
                  },
                  experience: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        company: { type: "string" },
                        role: { type: "string" },
                        period: { type: "string", description: "Exact dates as written" },
                        description: { type: "string", description: "ALL bullet points and achievements with metrics preserved" }
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
                        degree: { type: "string", description: "Full degree with major/minor/concentration" },
                        year: { type: "string" },
                        gpa: { type: "string" },
                        honors: { type: "string" }
                      },
                      required: ["institution", "degree", "year"]
                    }
                  },
                  certifications: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "All certifications with issuing org and date if available"
                  },
                  achievements: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Awards, publications, patents, notable accomplishments"
                  },
                  extractedLinks: {
                    type: "object",
                    properties: {
                      email: { type: "string" },
                      phone: { type: "string" },
                      github: { type: "string" },
                      linkedin: { type: "string" },
                      website: { type: "string" },
                      location: { type: "string" }
                    }
                  },
                  warnings: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Any unclear, incomplete, or potentially missing information"
                  },
                  unmappedSections: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Section headings that couldn't be classified"
                  }
                },
                required: ["detectedRole", "heroTitle", "heroSubtitle", "about", "skills", "experience"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_resume_data" } }
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
    
    // Handle tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        parsedData = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
        throw new Error("Could not parse response");
      }
    } else {
      // Fallback to content parsing
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

    // Store raw text and validate arrays
    parsedData.rawText = textContent;
    parsedData.skills = Array.isArray(parsedData.skills) ? parsedData.skills.slice(0, 100) : [];
    parsedData.projects = Array.isArray(parsedData.projects) ? parsedData.projects.slice(0, 50) : [];
    parsedData.experience = Array.isArray(parsedData.experience) ? parsedData.experience.slice(0, 50) : [];
    parsedData.education = Array.isArray(parsedData.education) ? parsedData.education.slice(0, 20) : [];
    parsedData.certifications = Array.isArray(parsedData.certifications) ? parsedData.certifications.slice(0, 50) : [];
    parsedData.achievements = Array.isArray(parsedData.achievements) ? parsedData.achievements.slice(0, 50) : [];
    parsedData.warnings = Array.isArray(parsedData.warnings) ? parsedData.warnings.slice(0, 20) : [];
    parsedData.unmappedSections = Array.isArray(parsedData.unmappedSections) ? parsedData.unmappedSections.slice(0, 20) : [];
    parsedData.extractedLinks = parsedData.extractedLinks || {};
    parsedData.rawTextPreserved = true;
    
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
