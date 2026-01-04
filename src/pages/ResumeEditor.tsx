import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, Save, Download, Loader2, FileText, Target, 
  Sparkles, Wand2, RotateCcw, History, ChevronDown, AlertCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumePDFPreview } from "@/components/editor/ResumePDFPreview";
import { ResumeATSScore } from "@/components/resume/ResumeATSScore";
import { ResumeBulletEditor } from "@/components/resume/ResumeBulletEditor";
import { ResumeJobOptimizer } from "@/components/resume/ResumeJobOptimizer";
import { ResumeTemplateSelector } from "@/components/resume/ResumeTemplateSelector";
import { getClientErrorMessage } from "@/lib/error-utils";

interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
}

interface Project {
  title: string;
  description: string;
  technologies: string[];
  link?: string;
}

interface Education {
  institution: string;
  degree: string;
  year: string;
}

interface Resume {
  id: string;
  name: string;
  target_role: string | null;
  target_company: string | null;
  job_description: string | null;
  template: string;
  page_limit: number;
  ats_score: number | null;
  ats_suggestions: any[] | null;
  summary_override: string | null;
  experience_override: Experience[] | null;
  skills_override: string[] | null;
  projects_override: Project[] | null;
  education_override: Education[] | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_linkedin: string | null;
  contact_github: string | null;
  contact_website: string | null;
  portfolio_id: string | null;
}

interface Portfolio {
  hero_title: string | null;
  hero_subtitle: string | null;
  about_text: string | null;
  skills: string[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  links: {
    github?: string;
    linkedin?: string;
    website?: string;
    email?: string;
  };
}

export default function ResumeEditor() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resume, setResume] = useState<Resume | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    fetchResume();
  }, [user, id]);

  const fetchResume = async () => {
    const { data: resumeData, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !resumeData) {
      toast({ title: "Resume not found", variant: "destructive" });
      navigate("/resumes");
      return;
    }

    setResume({
      ...resumeData,
      experience_override: Array.isArray(resumeData.experience_override) ? resumeData.experience_override as unknown as Experience[] : null,
      skills_override: Array.isArray(resumeData.skills_override) ? resumeData.skills_override as unknown as string[] : null,
      projects_override: Array.isArray(resumeData.projects_override) ? resumeData.projects_override as unknown as Project[] : null,
      education_override: Array.isArray(resumeData.education_override) ? resumeData.education_override as unknown as Education[] : null,
      ats_suggestions: Array.isArray(resumeData.ats_suggestions) ? resumeData.ats_suggestions : null,
    });

    // Fetch linked portfolio if exists
    if (resumeData.portfolio_id) {
      const { data: portfolioData } = await supabase
        .from("portfolios")
        .select("hero_title, hero_subtitle, about_text, skills, experience, projects, education, links")
        .eq("id", resumeData.portfolio_id)
        .single();

      if (portfolioData) {
        setPortfolio({
          ...portfolioData,
          skills: (portfolioData.skills as string[]) || [],
          experience: (portfolioData.experience as unknown as Experience[]) || [],
          projects: (portfolioData.projects as unknown as Project[]) || [],
          education: (portfolioData.education as unknown as Education[]) || [],
          links: (portfolioData.links as Portfolio["links"]) || {},
        });
      }
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!resume) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("resumes")
        .update({
          name: resume.name,
          target_role: resume.target_role,
          target_company: resume.target_company,
          job_description: resume.job_description,
          template: resume.template,
          page_limit: resume.page_limit,
          summary_override: resume.summary_override,
          experience_override: resume.experience_override ? JSON.parse(JSON.stringify(resume.experience_override)) : null,
          skills_override: resume.skills_override,
          projects_override: resume.projects_override ? JSON.parse(JSON.stringify(resume.projects_override)) : null,
          education_override: resume.education_override ? JSON.parse(JSON.stringify(resume.education_override)) : null,
          contact_email: resume.contact_email,
          contact_phone: resume.contact_phone,
          contact_linkedin: resume.contact_linkedin,
          contact_github: resume.contact_github,
          contact_website: resume.contact_website,
          ats_score: resume.ats_score,
          ats_suggestions: resume.ats_suggestions,
        })
        .eq("id", resume.id);

      if (error) throw error;
      toast({ title: "Resume saved!" });
    } catch (error) {
      toast({ title: "Save failed", description: getClientErrorMessage(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateResume = (updates: Partial<Resume>) => {
    if (resume) {
      setResume({ ...resume, ...updates });
    }
  };

  // Get effective content (override or portfolio data)
  const getEffectiveContent = useCallback(() => {
    const name = resume?.name || "";
    const title = resume?.target_role || portfolio?.hero_title?.split(" - ")[1] || "";
    
    return {
      id: resume?.id || "",
      hero_title: portfolio?.hero_title || name,
      hero_subtitle: title,
      about_text: resume?.summary_override || portfolio?.about_text || "",
      skills: resume?.skills_override || portfolio?.skills || [],
      experience: resume?.experience_override || portfolio?.experience || [],
      projects: resume?.projects_override || portfolio?.projects || [],
      education: resume?.education_override || portfolio?.education || [],
      links: {
        email: resume?.contact_email || portfolio?.links?.email,
        phone: resume?.contact_phone,
        linkedin: resume?.contact_linkedin || portfolio?.links?.linkedin,
        github: resume?.contact_github || portfolio?.links?.github,
        website: resume?.contact_website || portfolio?.links?.website,
      },
    };
  }, [resume, portfolio]);

  const resetToPortfolioData = (field: "summary" | "experience" | "skills" | "projects" | "education") => {
    if (!resume) return;
    
    const updates: Partial<Resume> = {};
    switch (field) {
      case "summary":
        updates.summary_override = null;
        break;
      case "experience":
        updates.experience_override = null;
        break;
      case "skills":
        updates.skills_override = null;
        break;
      case "projects":
        updates.projects_override = null;
        break;
      case "education":
        updates.education_override = null;
        break;
    }
    updateResume(updates);
    toast({ title: `Reset to portfolio ${field}` });
  };

  if (loading || !resume) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const effectiveContent = getEffectiveContent();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-xl flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/resumes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Resumes
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{resume.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
          <Button variant="hero" size="sm" onClick={() => setPreviewOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Preview & Export
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor panel */}
        <div className="w-[520px] border-r border-border/50 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-3 m-2">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="optimize">Optimize</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4">
              <TabsContent value="content" className="mt-0 space-y-6">
                {/* Resume Name & Target */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Resume Name</Label>
                    <Input
                      value={resume.name}
                      onChange={(e) => updateResume({ name: e.target.value })}
                      placeholder="e.g., Software Engineer Resume"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Target Role</Label>
                      <Input
                        value={resume.target_role || ""}
                        onChange={(e) => updateResume({ target_role: e.target.value })}
                        placeholder="e.g., Senior Developer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Company</Label>
                      <Input
                        value={resume.target_company || ""}
                        onChange={(e) => updateResume({ target_company: e.target.value })}
                        placeholder="e.g., Google"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary Section */}
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <span className="font-semibold text-sm">Professional Summary</span>
                    <ChevronDown className="w-4 h-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 space-y-3">
                    <Textarea
                      value={resume.summary_override || portfolio?.about_text || ""}
                      onChange={(e) => updateResume({ summary_override: e.target.value })}
                      placeholder="Write a compelling professional summary..."
                      className="min-h-[120px]"
                    />
                    {resume.summary_override && portfolio?.about_text && (
                      <Button variant="ghost" size="sm" onClick={() => resetToPortfolioData("summary")}>
                        <RotateCcw className="w-3 h-3 mr-1" /> Reset to portfolio
                      </Button>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Experience Section */}
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <span className="font-semibold text-sm">Experience</span>
                    <ChevronDown className="w-4 h-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    <ResumeBulletEditor
                      experience={resume.experience_override || portfolio?.experience || []}
                      onChange={(exp) => updateResume({ experience_override: exp })}
                      onReset={() => resetToPortfolioData("experience")}
                      hasOverride={!!resume.experience_override}
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* Skills Section */}
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <span className="font-semibold text-sm">Skills</span>
                    <ChevronDown className="w-4 h-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 space-y-3">
                    <Input
                      value={(resume.skills_override || portfolio?.skills || []).join(", ")}
                      onChange={(e) => updateResume({ 
                        skills_override: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                      })}
                      placeholder="React, TypeScript, Node.js..."
                    />
                    {resume.skills_override && portfolio?.skills && (
                      <Button variant="ghost" size="sm" onClick={() => resetToPortfolioData("skills")}>
                        <RotateCcw className="w-3 h-3 mr-1" /> Reset to portfolio
                      </Button>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Contact Info */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <span className="font-semibold text-sm">Contact Information</span>
                    <ChevronDown className="w-4 h-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Email</Label>
                        <Input
                          value={resume.contact_email || ""}
                          onChange={(e) => updateResume({ contact_email: e.target.value })}
                          placeholder="your@email.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Phone</Label>
                        <Input
                          value={resume.contact_phone || ""}
                          onChange={(e) => updateResume({ contact_phone: e.target.value })}
                          placeholder="+1 234 567 890"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">LinkedIn</Label>
                      <Input
                        value={resume.contact_linkedin || ""}
                        onChange={(e) => updateResume({ contact_linkedin: e.target.value })}
                        placeholder="linkedin.com/in/username"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">GitHub</Label>
                        <Input
                          value={resume.contact_github || ""}
                          onChange={(e) => updateResume({ contact_github: e.target.value })}
                          placeholder="github.com/username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Website</Label>
                        <Input
                          value={resume.contact_website || ""}
                          onChange={(e) => updateResume({ contact_website: e.target.value })}
                          placeholder="yoursite.com"
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>

              <TabsContent value="optimize" className="mt-0 space-y-6">
                {/* ATS Score */}
                <ResumeATSScore
                  resume={effectiveContent}
                  currentScore={resume.ats_score}
                  suggestions={resume.ats_suggestions}
                  onScoreUpdate={(score, suggestions) => {
                    updateResume({ ats_score: score, ats_suggestions: suggestions });
                  }}
                />

                {/* Job Description Optimizer */}
                <ResumeJobOptimizer
                  jobDescription={resume.job_description || ""}
                  onJobDescriptionChange={(jd) => updateResume({ job_description: jd })}
                  resume={effectiveContent}
                  onOptimizedContent={(content) => {
                    updateResume({
                      summary_override: content.summary,
                      skills_override: content.skills,
                    });
                  }}
                />
              </TabsContent>

              <TabsContent value="settings" className="mt-0 space-y-6">
                {/* Template Selection */}
                <ResumeTemplateSelector
                  currentTemplate={resume.template}
                  onSelect={(template) => updateResume({ template })}
                />

                {/* Page Limit */}
                <div className="space-y-3">
                  <Label>Page Limit</Label>
                  <Select 
                    value={resume.page_limit.toString()} 
                    onValueChange={(v) => updateResume({ page_limit: parseInt(v) as 1 | 2 })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">One page (recommended)</SelectItem>
                      <SelectItem value="2">Two pages</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    One-page resumes are preferred by most recruiters and ATS systems.
                  </p>
                </div>

                {/* Portfolio Link Info */}
                {resume.portfolio_id ? (
                  <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Linked to Portfolio</p>
                        <p className="text-sm text-muted-foreground">
                          This resume pulls data from your portfolio. Customize sections above to override.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">No Portfolio Linked</p>
                        <p className="text-sm text-muted-foreground">
                          Link this resume to a portfolio to auto-populate content.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="flex-1 bg-muted/30 p-6 overflow-auto">
          <div className="max-w-[816px] mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="p-8 text-gray-900 min-h-[1056px]">
              {/* Preview Header */}
              <div className="text-center mb-6 border-b border-gray-200 pb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {effectiveContent.hero_title?.split(" - ")[0] || "Your Name"}
                </h1>
                {effectiveContent.hero_subtitle && (
                  <p className="text-lg text-gray-600 mt-1">{effectiveContent.hero_subtitle}</p>
                )}
                <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                  {effectiveContent.links.email && <span>{effectiveContent.links.email}</span>}
                  {effectiveContent.links.phone && <span>• {effectiveContent.links.phone}</span>}
                  {effectiveContent.links.linkedin && <span>• LinkedIn</span>}
                </div>
              </div>

              {/* Summary */}
              {effectiveContent.about_text && (
                <div className="mb-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
                    Summary
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {effectiveContent.about_text.slice(0, 300)}
                    {effectiveContent.about_text.length > 300 && "..."}
                  </p>
                </div>
              )}

              {/* Experience */}
              {effectiveContent.experience.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
                    Experience
                  </h2>
                  {effectiveContent.experience.slice(0, 3).map((exp, i) => (
                    <div key={i} className="mb-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-sm">{exp.role}</span>
                        <span className="text-xs text-gray-500">{exp.period}</span>
                      </div>
                      <p className="text-sm text-gray-600">{exp.company}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{exp.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {effectiveContent.skills.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
                    Skills
                  </h2>
                  <p className="text-sm text-gray-700">
                    {effectiveContent.skills.slice(0, 15).join(" • ")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Dialog */}
      <ResumePDFPreview
        portfolio={effectiveContent}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
