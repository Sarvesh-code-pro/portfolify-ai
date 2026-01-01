import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ProfilePictureUpload } from "@/components/editor/ProfilePictureUpload";
import { 
  Sparkles, ArrowRight, ArrowLeft, Check, User, Briefcase, Target, Loader2 
} from "lucide-react";

const TOTAL_STEPS = 3;

export default function Onboarding() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form data
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setUsername(profile.username || "");
      setProfilePictureUrl(profile.profile_picture_url || null);
      setStep(profile.onboarding_step > 0 ? profile.onboarding_step : 1);
      
      // If already completed, redirect
      if (profile.onboarding_completed) {
        navigate("/dashboard");
      }
    }
  }, [profile, navigate]);

  const goalOptions = [
    { id: "job", label: "Land a new job", icon: Briefcase },
    { id: "freelance", label: "Get freelance clients", icon: User },
    { id: "showcase", label: "Showcase my work", icon: Target },
    { id: "network", label: "Expand my network", icon: User },
  ];

  const toggleGoal = (goalId: string) => {
    setGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId) 
        : [...prev, goalId]
    );
  };

  const handleNext = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Validate current step
      if (step === 1 && (!fullName.trim() || !username.trim())) {
        toast({ title: "Please fill in all fields", variant: "destructive" });
        setSaving(false);
        return;
      }

      // Check username availability
      if (step === 1) {
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username.toLowerCase())
          .neq("user_id", user.id)
          .single();

        if (existingUser) {
          toast({ title: "Username already taken", variant: "destructive" });
          setSaving(false);
          return;
        }
      }

      // Save current step progress
      const updateData: Record<string, unknown> = {
        onboarding_step: step + 1,
      };

      if (step === 1) {
        updateData.full_name = fullName;
        updateData.username = username.toLowerCase();
        updateData.profile_picture_url = profilePictureUrl;
      }

      if (step === TOTAL_STEPS) {
        updateData.onboarding_completed = true;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) throw error;

      if (step === TOTAL_STEPS) {
        await refreshProfile();
        toast({ title: "Welcome to Portfolify! 🎉" });
        navigate("/dashboard");
      } else {
        setStep(step + 1);
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(217_91%_60%/0.1)_0%,transparent_50%)]" />

      <div className="w-full max-w-lg relative z-10">
        <div className="p-8 rounded-2xl bg-card border border-border/50 shadow-xl">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl">Portfolify</span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    i + 1 < step
                      ? "bg-primary text-primary-foreground"
                      : i + 1 === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < TOTAL_STEPS - 1 && (
                  <div
                    className={`w-12 h-1 mx-1 rounded-full transition-colors ${
                      i + 1 < step ? "bg-primary" : "bg-secondary"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Profile Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold mb-2">
                  Let's set up your profile
                </h2>
                <p className="text-muted-foreground">
                  Tell us a bit about yourself
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Profile Picture</Label>
                  <ProfilePictureUpload
                    userId={user?.id || ""}
                    value={profilePictureUrl}
                    onChange={setProfilePictureUrl}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      portfolify.com/
                    </span>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="johndoe"
                      className="pl-28"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will be your public portfolio URL
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold mb-2">
                  What's your goal?
                </h2>
                <p className="text-muted-foreground">
                  We'll personalize your experience based on this
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {goalOptions.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      goals.includes(goal.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <goal.icon
                      className={`w-5 h-5 mb-2 ${
                        goals.includes(goal.id) ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span className="font-medium text-sm">{goal.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Bio */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold mb-2">
                  Tell your story
                </h2>
                <p className="text-muted-foreground">
                  Write a short bio that will appear on your portfolio
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (optional)</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="I'm a passionate developer with 5 years of experience..."
                  className="min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground">
                  You can always edit this later in your portfolio editor
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button variant="ghost" onClick={handleBack} disabled={saving}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}
            <Button variant="hero" onClick={handleNext} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {step === TOTAL_STEPS ? "Get Started" : "Continue"}
              {!saving && step < TOTAL_STEPS && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
