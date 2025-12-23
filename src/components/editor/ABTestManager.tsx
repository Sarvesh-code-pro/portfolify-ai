import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  FlaskConical, Plus, Trash2, Play, Pause, BarChart3, ExternalLink
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface PortfolioVersion {
  id: string;
  username: string;
  version_name: string | null;
  hero_title: string | null;
  status: string;
}

interface ABTest {
  id: string;
  name: string;
  status: string;
  version_a_id: string;
  version_b_id: string;
  traffic_split: number;
  started_at: string;
  ended_at: string | null;
}

interface ABTestManagerProps {
  portfolioId: string;
  userId: string;
}

export function ABTestManager({ portfolioId, userId }: ABTestManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tests, setTests] = useState<ABTest[]>([]);
  const [versions, setVersions] = useState<PortfolioVersion[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTestName, setNewTestName] = useState("");
  const [versionAId, setVersionAId] = useState("");
  const [versionBId, setVersionBId] = useState("");
  const [trafficSplit, setTrafficSplit] = useState(50);
  const [analytics, setAnalytics] = useState<Record<string, { views: number; clicks: number }>>({});
  const { toast } = useToast();

  const fetchData = async () => {
    // Fetch all portfolio versions (current + child versions)
    const { data: allPortfolios } = await supabase
      .from("portfolios")
      .select("id, username, version_name, hero_title, status")
      .or(`id.eq.${portfolioId},parent_portfolio_id.eq.${portfolioId}`)
      .eq("user_id", userId);

    if (allPortfolios) {
      setVersions(allPortfolios as PortfolioVersion[]);
      if (allPortfolios.length > 0 && !versionAId) {
        setVersionAId(allPortfolios[0].id);
      }
    }

    // Fetch existing A/B tests
    const { data: testsData } = await supabase
      .from("portfolio_ab_tests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (testsData) {
      setTests(testsData as ABTest[]);
      
      // Fetch analytics for each version in active tests
      const analyticsMap: Record<string, { views: number; clicks: number }> = {};
      for (const test of testsData) {
        for (const versionId of [test.version_a_id, test.version_b_id]) {
          const { data: viewsData } = await supabase
            .from("portfolio_analytics")
            .select("view_count")
            .eq("portfolio_id", versionId);
          
          const { data: clicksData } = await supabase
            .from("portfolio_link_clicks")
            .select("click_count")
            .eq("portfolio_id", versionId);

          analyticsMap[versionId] = {
            views: viewsData?.reduce((sum, r) => sum + r.view_count, 0) || 0,
            clicks: clicksData?.reduce((sum, r) => sum + r.click_count, 0) || 0
          };
        }
      }
      setAnalytics(analyticsMap);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, portfolioId, userId]);

  const createTest = async () => {
    if (!newTestName.trim() || !versionAId || !versionBId) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    if (versionAId === versionBId) {
      toast({ title: "Select different versions for A and B", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase
        .from("portfolio_ab_tests")
        .insert({
          user_id: userId,
          name: newTestName,
          version_a_id: versionAId,
          version_b_id: versionBId,
          traffic_split: trafficSplit,
          status: "active"
        });

      if (error) throw error;

      toast({ title: "A/B test created", description: "Test is now active." });
      setNewTestName("");
      setTrafficSplit(50);
      fetchData();
    } catch (error: any) {
      toast({ title: "Failed to create test", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const toggleTestStatus = async (testId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    const { error } = await supabase
      .from("portfolio_ab_tests")
      .update({ 
        status: newStatus,
        ended_at: newStatus === "paused" ? new Date().toISOString() : null 
      })
      .eq("id", testId);

    if (error) {
      toast({ title: "Update failed", variant: "destructive" });
    } else {
      toast({ title: `Test ${newStatus}` });
      fetchData();
    }
  };

  const deleteTest = async (testId: string) => {
    if (!confirm("Delete this A/B test?")) return;

    const { error } = await supabase
      .from("portfolio_ab_tests")
      .delete()
      .eq("id", testId);

    if (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    } else {
      toast({ title: "Test deleted" });
      fetchData();
    }
  };

  const getVersionName = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    return version?.version_name || version?.hero_title || version?.username || "Unknown";
  };

  const calculateConversionRate = (versionId: string) => {
    const data = analytics[versionId];
    if (!data || data.views === 0) return "0%";
    return ((data.clicks / data.views) * 100).toFixed(1) + "%";
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <FlaskConical className="w-4 h-4" />
        A/B Tests
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5" />
              A/B Testing
            </DialogTitle>
            <DialogDescription>
              Compare performance between different portfolio versions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Create new test */}
            {versions.length >= 2 ? (
              <div className="p-4 rounded-xl border border-border bg-card">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Test
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Test Name</Label>
                    <Input
                      placeholder="e.g., Tech vs Impact Focus"
                      value={newTestName}
                      onChange={(e) => setNewTestName(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Version A</Label>
                      <Select value={versionAId} onValueChange={setVersionAId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          {versions.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.version_name || v.hero_title || v.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Version B</Label>
                      <Select value={versionBId} onValueChange={setVersionBId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          {versions.filter(v => v.id !== versionAId).map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.version_name || v.hero_title || v.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Traffic Split: {trafficSplit}% A / {100 - trafficSplit}% B</Label>
                    <Slider
                      value={[trafficSplit]}
                      onValueChange={(v) => setTrafficSplit(v[0])}
                      min={10}
                      max={90}
                      step={10}
                    />
                  </div>

                  <Button 
                    onClick={createTest} 
                    disabled={creating || !newTestName.trim() || !versionAId || !versionBId}
                    className="w-full"
                  >
                    <FlaskConical className="w-4 h-4 mr-2" />
                    Start Test
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-border bg-secondary/30 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  You need at least 2 portfolio versions to run an A/B test.
                </p>
                <p className="text-sm text-muted-foreground">
                  Create versions from the Versions tab first.
                </p>
              </div>
            )}

            {/* Existing tests */}
            {tests.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Active Tests
                </h3>
                {tests.map((test) => (
                  <div 
                    key={test.id}
                    className="p-4 rounded-xl border border-border bg-secondary/30"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{test.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            test.status === "active" 
                              ? "bg-success/20 text-success" 
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {test.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Started {new Date(test.started_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleTestStatus(test.id, test.status)}
                        >
                          {test.status === "active" ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteTest(test.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Comparison stats */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <div className="text-xs text-muted-foreground mb-1">Version A ({test.traffic_split}%)</div>
                        <div className="font-medium text-sm truncate">
                          {getVersionName(test.version_a_id)}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span>{analytics[test.version_a_id]?.views || 0} views</span>
                          <span className="text-primary font-medium">
                            {calculateConversionRate(test.version_a_id)} CTR
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <div className="text-xs text-muted-foreground mb-1">Version B ({100 - test.traffic_split}%)</div>
                        <div className="font-medium text-sm truncate">
                          {getVersionName(test.version_b_id)}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span>{analytics[test.version_b_id]?.views || 0} views</span>
                          <span className="text-primary font-medium">
                            {calculateConversionRate(test.version_b_id)} CTR
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tests.length === 0 && versions.length >= 2 && (
              <p className="text-center text-muted-foreground text-sm py-4">
                No A/B tests yet. Create one to compare portfolio versions.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}