import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Plus, 
  Trash2,
  Sparkles,
  Loader2
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

export interface ExtractedData {
  detectedRole: "developer" | "designer" | "product_manager";
  heroTitle: string;
  heroSubtitle: string;
  about: string;
  skills: string[];
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
    link: string;
  }>;
  experience: Array<{
    company: string;
    role: string;
    period: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  certifications?: string[];
  achievements?: string[];
  extractedLinks: {
    github: string;
    linkedin: string;
    website: string;
    email?: string;
    phone?: string;
  };
  rawText?: string;
  warnings?: string[];
  unmappedSections?: string[];
}

interface ExtractedDataReviewProps {
  data: ExtractedData;
  onChange: (data: ExtractedData) => void;
  onConfirm: () => void;
  onBack: () => void;
  isGenerating?: boolean;
}

export function ExtractedDataReview({ 
  data, 
  onChange, 
  onConfirm, 
  onBack,
  isGenerating = false
}: ExtractedDataReviewProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    experience: true,
    skills: true,
    projects: false,
    education: false,
    links: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateField = (field: keyof ExtractedData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...data.experience];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, experience: updated });
  };

  const addExperience = () => {
    onChange({
      ...data,
      experience: [...data.experience, { company: "", role: "", period: "", description: "" }]
    });
  };

  const removeExperience = (index: number) => {
    onChange({
      ...data,
      experience: data.experience.filter((_, i) => i !== index)
    });
  };

  const updateProject = (index: number, field: string, value: any) => {
    const updated = [...data.projects];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, projects: updated });
  };

  const addProject = () => {
    onChange({
      ...data,
      projects: [...data.projects, { title: "", description: "", technologies: [], link: "" }]
    });
  };

  const removeProject = (index: number) => {
    onChange({
      ...data,
      projects: data.projects.filter((_, i) => i !== index)
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...data.education];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, education: updated });
  };

  const addEducation = () => {
    onChange({
      ...data,
      education: [...data.education, { institution: "", degree: "", year: "" }]
    });
  };

  const removeEducation = (index: number) => {
    onChange({
      ...data,
      education: data.education.filter((_, i) => i !== index)
    });
  };

  const updateSkills = (value: string) => {
    const skills = value.split(",").map(s => s.trim()).filter(Boolean);
    onChange({ ...data, skills });
  };

  const updateLink = (key: string, value: string) => {
    onChange({
      ...data,
      extractedLinks: { ...data.extractedLinks, [key]: value }
    });
  };

  const hasWarnings = (data.warnings && data.warnings.length > 0) || 
                      (data.unmappedSections && data.unmappedSections.length > 0);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Review Extracted Information</h2>
        <p className="text-muted-foreground">
          Please review and edit the information extracted from your resume before generating your portfolio.
        </p>
      </div>

      {/* Warnings */}
      {hasWarnings && (
        <Alert variant="destructive" className="bg-warning/10 border-warning text-warning-foreground">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Some content may need attention:</p>
            <ul className="list-disc pl-4 space-y-1">
              {data.warnings?.map((warning, i) => (
                <li key={i} className="text-sm">{warning}</li>
              ))}
              {data.unmappedSections?.map((section, i) => (
                <li key={`unmapped-${i}`} className="text-sm">
                  Could not classify section: "{section}"
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Detected Role */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
        <span className="text-sm text-muted-foreground">Detected Role:</span>
        <select
          value={data.detectedRole}
          onChange={(e) => updateField("detectedRole", e.target.value)}
          className="bg-secondary px-3 py-1.5 rounded-lg text-sm font-medium"
        >
          <option value="developer">Developer</option>
          <option value="designer">Designer</option>
          <option value="product_manager">Product Manager</option>
        </select>
      </div>

      {/* Basic Info */}
      <Collapsible open={openSections.basic} onOpenChange={() => toggleSection("basic")}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Basic Information</span>
            {data.heroTitle && data.heroSubtitle ? (
              <Badge variant="outline" className="text-success border-success">
                <Check className="w-3 h-3 mr-1" /> Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="text-warning border-warning">
                <AlertTriangle className="w-3 h-3 mr-1" /> Incomplete
              </Badge>
            )}
          </div>
          {openSections.basic ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4 mt-2 rounded-xl bg-card/50 border border-border">
          <div>
            <Label>Name & Title</Label>
            <Input
              value={data.heroTitle}
              onChange={(e) => updateField("heroTitle", e.target.value)}
              placeholder="John Doe - Senior Software Engineer"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Subtitle / Tagline</Label>
            <Input
              value={data.heroSubtitle}
              onChange={(e) => updateField("heroSubtitle", e.target.value)}
              placeholder="Building scalable web applications"
              className="mt-1"
            />
          </div>
          <div>
            <Label>About / Summary</Label>
            <Textarea
              value={data.about}
              onChange={(e) => updateField("about", e.target.value)}
              placeholder="Write a brief professional summary..."
              className="mt-1 min-h-[120px]"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Experience */}
      <Collapsible open={openSections.experience} onOpenChange={() => toggleSection("experience")}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Experience</span>
            <Badge variant="secondary">{data.experience.length} entries</Badge>
          </div>
          {openSections.experience ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4 mt-2 rounded-xl bg-card/50 border border-border">
          {data.experience.map((exp, index) => (
            <div key={index} className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Experience {index + 1}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeExperience(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Company</Label>
                  <Input
                    value={exp.company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    placeholder="Company Name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Role</Label>
                  <Input
                    value={exp.role}
                    onChange={(e) => updateExperience(index, "role", e.target.value)}
                    placeholder="Job Title"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Period</Label>
                <Input
                  value={exp.period}
                  onChange={(e) => updateExperience(index, "period", e.target.value)}
                  placeholder="Jan 2020 - Present"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Description / Achievements</Label>
                <Textarea
                  value={exp.description}
                  onChange={(e) => updateExperience(index, "description", e.target.value)}
                  placeholder="Key accomplishments and responsibilities..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addExperience} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Skills */}
      <Collapsible open={openSections.skills} onOpenChange={() => toggleSection("skills")}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Skills</span>
            <Badge variant="secondary">{data.skills.length} skills</Badge>
          </div>
          {openSections.skills ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4 mt-2 rounded-xl bg-card/50 border border-border">
          <div>
            <Label>Skills (comma-separated)</Label>
            <Textarea
              value={data.skills.join(", ")}
              onChange={(e) => updateSkills(e.target.value)}
              placeholder="JavaScript, React, Node.js, Python, AWS..."
              className="mt-1 min-h-[80px]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, i) => (
              <Badge key={i} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Projects */}
      <Collapsible open={openSections.projects} onOpenChange={() => toggleSection("projects")}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Projects</span>
            <Badge variant="secondary">{data.projects.length} projects</Badge>
          </div>
          {openSections.projects ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4 mt-2 rounded-xl bg-card/50 border border-border">
          {data.projects.map((project, index) => (
            <div key={index} className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Project {index + 1}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeProject(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <Label className="text-xs">Title</Label>
                <Input
                  value={project.title}
                  onChange={(e) => updateProject(index, "title", e.target.value)}
                  placeholder="Project Name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={project.description}
                  onChange={(e) => updateProject(index, "description", e.target.value)}
                  placeholder="What the project does..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Technologies (comma-separated)</Label>
                <Input
                  value={project.technologies?.join(", ") || ""}
                  onChange={(e) => updateProject(index, "technologies", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                  placeholder="React, TypeScript, Node.js"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Link</Label>
                <Input
                  value={project.link}
                  onChange={(e) => updateProject(index, "link", e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addProject} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Education */}
      <Collapsible open={openSections.education} onOpenChange={() => toggleSection("education")}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Education</span>
            <Badge variant="secondary">{data.education.length} entries</Badge>
          </div>
          {openSections.education ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4 mt-2 rounded-xl bg-card/50 border border-border">
          {data.education.map((edu, index) => (
            <div key={index} className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Education {index + 1}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeEducation(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <Label className="text-xs">Institution</Label>
                <Input
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, "institution", e.target.value)}
                  placeholder="University Name"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Degree</Label>
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    placeholder="Bachelor's in Computer Science"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Year</Label>
                  <Input
                    value={edu.year}
                    onChange={(e) => updateEducation(index, "year", e.target.value)}
                    placeholder="2020"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addEducation} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Education
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Links */}
      <Collapsible open={openSections.links} onOpenChange={() => toggleSection("links")}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Contact & Links</span>
          </div>
          {openSections.links ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4 mt-2 rounded-xl bg-card/50 border border-border">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                value={data.extractedLinks.email || ""}
                onChange={(e) => updateLink("email", e.target.value)}
                placeholder="email@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input
                value={data.extractedLinks.phone || ""}
                onChange={(e) => updateLink("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">LinkedIn</Label>
            <Input
              value={data.extractedLinks.linkedin}
              onChange={(e) => updateLink("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">GitHub</Label>
            <Input
              value={data.extractedLinks.github}
              onChange={(e) => updateLink("github", e.target.value)}
              placeholder="https://github.com/username"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Website</Label>
            <Input
              value={data.extractedLinks.website}
              onChange={(e) => updateLink("website", e.target.value)}
              placeholder="https://yourwebsite.com"
              className="mt-1"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-border">
        <Button variant="outline" onClick={onBack}>
          Back to Resume
        </Button>
        <Button onClick={onConfirm} disabled={isGenerating} variant="gradient" size="lg">
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generating Portfolio...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Portfolio
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
