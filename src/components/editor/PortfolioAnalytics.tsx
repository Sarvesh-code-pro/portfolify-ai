import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, Eye, MousePointerClick, Calendar, TrendingUp
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AnalyticsData {
  totalViews: number;
  lastViewDate: string | null;
  linkClicks: { link_type: string; link_url: string; click_count: number }[];
  dailyViews: { date: string; views: number }[];
}

interface PortfolioAnalyticsProps {
  portfolioId: string;
  isPublished: boolean;
}

export function PortfolioAnalytics({ portfolioId, isPublished }: PortfolioAnalyticsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch view analytics
      const { data: viewData, error: viewError } = await supabase
        .from("portfolio_analytics")
        .select("*")
        .eq("portfolio_id", portfolioId)
        .order("view_date", { ascending: false })
        .limit(30);

      // Fetch link clicks
      const { data: clickData, error: clickError } = await supabase
        .from("portfolio_link_clicks")
        .select("*")
        .eq("portfolio_id", portfolioId)
        .order("click_count", { ascending: false });

      const totalViews = viewData?.reduce((sum, day) => sum + day.view_count, 0) || 0;
      const lastViewDate = viewData && viewData.length > 0 ? viewData[0].view_date : null;

      setAnalytics({
        totalViews,
        lastViewDate,
        linkClicks: clickData || [],
        dailyViews: viewData?.map(d => ({ date: d.view_date, views: d.view_count })) || []
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen, portfolioId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="gap-2"
        disabled={!isPublished}
      >
        <BarChart3 className="w-4 h-4" />
        Analytics
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Portfolio Analytics
            </DialogTitle>
            <DialogDescription>
              Track views and engagement on your published portfolio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : analytics ? (
              <>
                {/* Overview cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-card border border-border text-center">
                    <Eye className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <div className="text-3xl font-bold">{analytics.totalViews}</div>
                    <div className="text-sm text-muted-foreground">Total Views</div>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border text-center">
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <div className="text-sm font-medium">
                      {analytics.lastViewDate ? formatDate(analytics.lastViewDate) : "Never"}
                    </div>
                    <div className="text-sm text-muted-foreground">Last Viewed</div>
                  </div>
                </div>

                {/* Daily views chart (simplified) */}
                {analytics.dailyViews.length > 0 && (
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Recent Views
                    </h3>
                    <div className="space-y-2">
                      {analytics.dailyViews.slice(0, 7).map((day) => (
                        <div key={day.date} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-20">
                            {formatDate(day.date)}
                          </span>
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ 
                                width: `${Math.min(100, (day.views / Math.max(...analytics.dailyViews.map(d => d.views))) * 100)}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">
                            {day.views}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Link clicks */}
                {analytics.linkClicks.length > 0 && (
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <MousePointerClick className="w-4 h-4" />
                      Link Clicks
                    </h3>
                    <div className="space-y-2">
                      {analytics.linkClicks.map((click, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div>
                            <span className="capitalize text-sm font-medium">{click.link_type}</span>
                            <span className="text-xs text-muted-foreground ml-2 truncate max-w-[150px] inline-block align-middle">
                              {click.link_url}
                            </span>
                          </div>
                          <span className="text-sm font-semibold">{click.click_count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analytics.totalViews === 0 && analytics.linkClicks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No analytics data yet.</p>
                    <p className="text-sm">Share your portfolio to start tracking views!</p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
