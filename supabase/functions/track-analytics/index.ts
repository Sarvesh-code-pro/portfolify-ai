import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { portfolioId, eventType, linkType, linkUrl } = await req.json();

    if (!portfolioId) {
      throw new Error("Portfolio ID is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];

    if (eventType === "view") {
      // Track page view
      const { data: existing } = await supabase
        .from("portfolio_analytics")
        .select("*")
        .eq("portfolio_id", portfolioId)
        .eq("view_date", today)
        .single();

      if (existing) {
        // Update existing record
        await supabase
          .from("portfolio_analytics")
          .update({
            view_count: existing.view_count + 1,
          })
          .eq("id", existing.id);
      } else {
        // Create new record
        await supabase
          .from("portfolio_analytics")
          .insert({
            portfolio_id: portfolioId,
            view_date: today,
            view_count: 1,
            unique_visitors: 1,
          });
      }

      console.log("View tracked for portfolio:", portfolioId);
    } else if (eventType === "click" && linkType && linkUrl) {
      // Track link click
      const { data: existing } = await supabase
        .from("portfolio_link_clicks")
        .select("*")
        .eq("portfolio_id", portfolioId)
        .eq("link_type", linkType)
        .eq("link_url", linkUrl)
        .single();

      if (existing) {
        await supabase
          .from("portfolio_link_clicks")
          .update({
            click_count: existing.click_count + 1,
            last_clicked_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("portfolio_link_clicks")
          .insert({
            portfolio_id: portfolioId,
            link_type: linkType,
            link_url: linkUrl,
            click_count: 1,
            last_clicked_at: new Date().toISOString(),
          });
      }

      console.log("Click tracked:", linkType, "for portfolio:", portfolioId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Track analytics error:", error);
    const message = error instanceof Error ? error.message : "Tracking failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
