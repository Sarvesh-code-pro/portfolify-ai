import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation
const MAX_URL_LENGTH = 2000;
const MAX_LINK_TYPE_LENGTH = 100;

function getSafeErrorMessage(error: unknown): string {
  console.error("Full error details:", error);
  return "Tracking failed. Please try again.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { portfolioId, eventType, linkType, linkUrl } = await req.json();

    // Input validation
    if (!portfolioId || typeof portfolioId !== "string") {
      return new Response(
        JSON.stringify({ error: "Portfolio ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(portfolioId)) {
      return new Response(
        JSON.stringify({ error: "Invalid portfolio ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (linkUrl && typeof linkUrl === "string" && linkUrl.length > MAX_URL_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Link URL too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (linkType && typeof linkType === "string" && linkType.length > MAX_LINK_TYPE_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Link type too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing required configuration");
      throw new Error("Service configuration error");
    }
    
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
    const safeMessage = getSafeErrorMessage(error);
    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
