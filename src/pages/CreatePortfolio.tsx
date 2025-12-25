import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, ArrowLeft, ArrowRight, Code, Palette, Briefcase, Check, FileText,
  Database, Server, Bug, Shield, Smartphone, Search, PenTool, Megaphone, 
  Layers, BarChart3, FolderKanban, Users, LineChart
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

type Role = 
  | "developer" | "designer" | "product_manager" 
  | "data_scientist" | "devops_engineer" | "qa_engineer" | "security_engineer" | "mobile_developer"
  | "ux_researcher" | "content_writer" | "marketing_manager" | "brand_designer"
  | "business_analyst" | "project_manager" | "sales_engineer" | "consultant";

const roleCategories = [
  {
    category: "Tech",
    roles: [
      { id: "developer" as Role, title: "Developer", icon: Code, description: "Showcase your projects, tech stack, and coding expertise" },
      { id: "data_scientist" as Role, title: "Data Scientist", icon: Database, description: "Highlight ML models, analytics projects, and data insights" },
      { id: "devops_engineer" as Role, title: "DevOps Engineer", icon: Server, description: "Display infrastructure, CI/CD pipelines, and system architecture" },
      { id: "qa_engineer" as Role, title: "QA Engineer", icon: Bug, description: "Showcase testing frameworks, automation, and quality metrics" },
      { id: "security_engineer" as Role, title: "Security Engineer", icon: Shield, description: "Highlight security audits, penetration tests, and compliance work" },
      { id: "mobile_developer" as Role, title: "Mobile Developer", icon: Smartphone, description: "Feature iOS/Android apps, cross-platform projects, and app store metrics" },
    ]
  },
  {
    category: "Creative",
    roles: [
      { id: "designer" as Role, title: "Designer", icon: Palette, description: "Display your visual work, case studies, and design process" },
      { id: "ux_researcher" as Role, title: "UX Researcher", icon: Search, description: "Showcase user studies, research methodologies, and insights" },
      { id: "content_writer" as Role, title: "Content Writer", icon: PenTool, description: "Highlight published work, content strategy, and writing samples" },
      { id: "marketing_manager" as Role, title: "Marketing Manager", icon: Megaphone, description: "Feature campaigns, growth metrics, and brand initiatives" },
      { id: "brand_designer" as Role, title: "Brand Designer", icon: Layers, description: "Display brand identities, style guides, and visual systems" },
    ]
  },
  {
    category: "Business",
    roles: [
      { id: "product_manager" as Role, title: "Product Manager", icon: Briefcase, description: "Highlight product launches, metrics, and leadership" },
      { id: "business_analyst" as Role, title: "Business Analyst", icon: BarChart3, description: "Showcase analysis projects, process improvements, and insights" },
      { id: "project_manager" as Role, title: "Project Manager", icon: FolderKanban, description: "Display project deliveries, team leadership, and methodologies" },
      { id: "sales_engineer" as Role, title: "Sales Engineer", icon: Users, description: "Highlight technical demos, deal closures, and client solutions" },
      { id: "consultant" as Role, title: "Consultant", icon: LineChart, description: "Feature client engagements, strategy work, and business impact" },
    ]
  }
];

export default function CreatePortfolio() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleContinue = () => {
    if (selectedRole) {
      navigate(`/create/details?role=${selectedRole}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(217_91%_60%/0.1)_0%,transparent_50%)]" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="max-w-4xl mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">1</div>
              <span className="text-sm font-medium">Select Role</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-semibold text-sm">2</div>
              <span className="text-sm text-muted-foreground">Add Details</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-semibold text-sm">3</div>
              <span className="text-sm text-muted-foreground">Generate</span>
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="font-display text-4xl font-bold mb-3">What's your role?</h1>
            <p className="text-lg text-muted-foreground">
              We'll tailor your portfolio structure and content to match your profession.
            </p>
          </div>

          <div className="space-y-8">
            {roleCategories.map((category) => (
              <div key={category.category}>
                <h2 className="font-display text-lg font-semibold mb-4 text-muted-foreground">{category.category}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {category.roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`group p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-start gap-3 ${
                        selectedRole === role.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 bg-card"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        selectedRole === role.id ? "bg-primary/20" : "bg-secondary"
                      }`}>
                        <role.icon className={`w-5 h-5 ${selectedRole === role.id ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold mb-1">{role.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{role.description}</p>
                      </div>
                      {selectedRole === role.id && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row justify-between gap-4">
            <Button variant="outline" size="lg" asChild>
              <Link to="/create/resume">
                <FileText className="w-4 h-4 mr-2" />
                Create from Resume Instead
              </Link>
            </Button>
            <Button 
              variant="hero" 
              size="lg" 
              onClick={handleContinue}
              disabled={!selectedRole}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
