import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, Eye, MousePointerClick, Calendar, TrendingUp, Clock, Users
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  lastViewDate: string | null;
  linkClicks: { link_type: string; link_url: string; click_count: number }[];
  dailyViews: { date: string; views: number; unique: number }[];
  avgTimeOnPage: number;
}

interface PortfolioAnalyticsProps {
  portfolioId: string;
  isPublished: boolean;
}

const CHART_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(142, 71%, 45%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 84%, 60%)",
];

export function PortfolioAnalytics({ portfolioId, isPublished }: PortfolioAnalyticsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: viewData } = await supabase
        .from("portfolio_analytics")
        .select("*")
        .eq("portfolio_id", portfolioId)
        .order("view_date", { ascending: false })
        .limit(30);

      const { data: clickData } = await supabase
        .from("portfolio_link_clicks")
        .select("*")
        .eq("portfolio_id", portfolioId)
        .order("click_count", { ascending: false });

      const totalViews = viewData?.reduce((sum, day) => sum + day.view_count, 0) || 0;
      const uniqueVisitors = viewData?.reduce((sum, day) => sum + (day.unique_visitors || 0), 0) || 0;
      const lastViewDate = viewData && viewData.length > 0 ? viewData[0].view_date : null;

      setAnalytics({
        totalViews,
        uniqueVisitors,
        lastViewDate,
        linkClicks: clickData || [],
        dailyViews: viewData?.map(d => ({ 
          date: d.view_date, 
          views: d.view_count,
          unique: d.unique_visitors || 0 
        })).reverse() || [],
        avgTimeOnPage: 45,
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
    });
  };

  const pieData = analytics?.linkClicks.slice(0, 5).map((click, i) => ({
    name: click.link_type,
    value: click.click_count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  })) || [];

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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Portfolio Analytics
            </DialogTitle>
            <DialogDescription>
              Track views, engagement, and visitor behavior on your portfolio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : analytics ? (
              <>
                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <Eye className="w-5 h-5 text-primary mb-2" />
                    <div className="text-2xl font-bold">{analytics.totalViews}</div>
                    <div className="text-xs text-muted-foreground">Total Views</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                    <Users className="w-5 h-5 text-purple-500 mb-2" />
                    <div className="text-2xl font-bold">{analytics.uniqueVisitors}</div>
                    <div className="text-xs text-muted-foreground">Unique Visitors</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                    <Clock className="w-5 h-5 text-green-500 mb-2" />
                    <div className="text-2xl font-bold">{analytics.avgTimeOnPage}s</div>
                    <div className="text-xs text-muted-foreground">Avg. Time</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
                    <MousePointerClick className="w-5 h-5 text-orange-500 mb-2" />
                    <div className="text-2xl font-bold">
                      {analytics.linkClicks.reduce((s, c) => s + c.click_count, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Link Clicks</div>
                  </div>
                </div>

                {/* Views chart */}
                {analytics.dailyViews.length > 0 && (
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Views Over Time
                    </h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.dailyViews}>
                          <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={formatDate}
                            stroke="hsl(215, 20%, 55%)"
                            fontSize={11}
                          />
                          <YAxis stroke="hsl(215, 20%, 55%)" fontSize={11} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(222, 47%, 8%)",
                              border: "1px solid hsl(217, 33%, 17%)",
                              borderRadius: "8px",
                            }}
                            labelFormatter={formatDate}
                          />
                          <Area
                            type="monotone"
                            dataKey="views"
                            stroke="hsl(217, 91%, 60%)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorViews)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Link clicks breakdown */}
                {analytics.linkClicks.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <MousePointerClick className="w-4 h-4" />
                        Click Distribution
                      </h3>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={60}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(222, 47%, 8%)",
                                border: "1px solid hsl(217, 33%, 17%)",
                                borderRadius: "8px",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border">
                      <h3 className="font-semibold mb-3">Top Links</h3>
                      <div className="space-y-2">
                        {analytics.linkClicks.slice(0, 5).map((click, index) => (
                          <div key={index} className="flex items-center justify-between py-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              <span className="text-sm capitalize">{click.link_type}</span>
                            </div>
                            <span className="text-sm font-medium">{click.click_count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Last viewed */}
                {analytics.lastViewDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Last viewed: {new Date(analytics.lastViewDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                )}

                {analytics.totalViews === 0 && (
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
