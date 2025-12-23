import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, ArrowRight, Code, Palette, Briefcase, Check, FileText } from "lucide-react";
import type { User } from "@supabase/supabase-js";

type Role = "developer" | "designer" | "product_manager";

const roles = [
  {
    id: "developer" as Role,
    title: "Developer",
    icon: Code,
    color: "developer",
    description: "Showcase your projects, tech stack, and coding expertise"
  },
  {
    id: "designer" as Role,
    title: "Designer",
    icon: Palette,
    color: "designer",
    description: "Display your visual work, case studies, and design process"
  },
  {
    id: "product_manager" as Role,
    title: "Product Manager",
    icon: Briefcase,
    color: "product-manager",
    description: "Highlight your product launches, metrics, and leadership"
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

        <div className="max-w-3xl mx-auto">
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

          <div className="grid gap-4">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`group p-6 rounded-2xl border-2 transition-all duration-200 text-left flex items-center gap-5 ${
                  selectedRole === role.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30 bg-card"
                }`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                  selectedRole === role.id ? "bg-primary/20" : "bg-secondary"
                }`}>
                  <role.icon className={`w-7 h-7 ${selectedRole === role.id ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold mb-1">{role.title}</h3>
                  <p className="text-muted-foreground">{role.description}</p>
                </div>
                {selectedRole === role.id && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
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
