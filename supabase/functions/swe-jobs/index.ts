
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    // First, check whether jobs are already saved.
    const { data: cachedJobs, error: cacheError } = await supabase
      .from("job_snapshots")
      .select("*")
      .order("posted", { ascending: false })
      .limit(100);

    if (cacheError) throw cacheError;

    // Use saved jobs to avoid spending Adzuna API calls.
    if (cachedJobs && cachedJobs.length > 0) {
      return json({
        jobs: cachedJobs,
        count: cachedJobs.length,
        source: "cache",
      });
    }

    const appId = Deno.env.get("ADZUNA_APP_ID");
    const appKey = Deno.env.get("ADZUNA_APP_KEY");

    if (!appId || !appKey) {
      return json(
        { error: "Missing Adzuna API credentials" },
        500
      );
    }

    // Search Canadian software development positions.
    const url = new URL(
      "https://api.adzuna.com/v1/api/jobs/ca/search/1"
    );

    url.searchParams.set("app_id", appId);
    url.searchParams.set("app_key", appKey);
    url.searchParams.set("results_per_page", "50");
    url.searchParams.set("what", "software developer");
    url.searchParams.set("content-type", "application/json");

    const response = await fetch(url);

    if (!response.ok) {
      const details = await response.text();

      console.error("Adzuna API error:", details);

      return json(
        {
          error: "Failed to fetch Adzuna jobs",
          status: response.status,
        },
        502
      );
    }

    const result = await response.json();

    const jobs = (result.results ?? []).map((job: any) => ({
      id: String(job.id),
      title: job.title ?? "",
      company: job.company?.display_name ?? "",
      location: job.location?.display_name ?? "",
      description: job.description ?? "",
      url: job.redirect_url ?? "",
      posted: job.created ?? null,
    }));

    if (jobs.length === 0) {
      return json({
        jobs: [],
        count: 0,
        source: "adzuna",
      });
    }

    // Save real job postings in Supabase.
    const { error: saveError } = await supabase
      .from("job_snapshots")
      .upsert(jobs, { onConflict: "id" });

    if (saveError) {
      console.error("Database save failed:", saveError);
      return json(
        { error: "Failed to save job snapshots" },
        500
      );
    }

    return json({
      jobs,
      count: jobs.length,
      source: "adzuna",
      saved: true,
    });
  } catch (error) {
    console.error("SWE jobs function error:", error);

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      500
    );
  }
});
