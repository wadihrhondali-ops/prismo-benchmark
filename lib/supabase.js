// lib/supabase.js
// Client Supabase pour le benchmark PRISMO

const { createClient } = require("@supabase/supabase-js");

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_KEY manquant");
  return createClient(url, key);
}

/** Crée un nouveau run */
async function createRun(runId, providers, models) {
  const sb = getClient();
  const { data, error } = await sb.from("benchmark_runs").insert({
    run_id: runId,
    status: "running",
    providers: providers,
    models: models,
    stages_completed: 0,
  }).select();
  if (error) console.error("createRun error:", error.message);
  return data;
}

/** Met à jour le statut d'un run */
async function updateRun(runId, updates) {
  const sb = getClient();
  const { error } = await sb.from("benchmark_runs")
    .update(updates)
    .eq("run_id", runId);
  if (error) console.error("updateRun error:", error.message);
}

/** Insère une réponse brute */
async function insertResponse(row) {
  const sb = getClient();
  const { data, error } = await sb.from("benchmark_responses").insert(row).select();
  if (error) {
    console.error("insertResponse error:", error.message);
    return null;
  }
  return data?.[0];
}

/** Insère un score */
async function insertScore(row) {
  const sb = getClient();
  const { error } = await sb.from("benchmark_scores").insert(row);
  if (error) console.error("insertScore error:", error.message);
}

/** Insère une recommandation dans la matrice */
async function insertMatrix(row) {
  const sb = getClient();
  const { error } = await sb.from("orchestration_matrix").insert(row);
  if (error) console.error("insertMatrix error:", error.message);
}

/** Récupère tous les scores d'un run */
async function getScoresByRun(runId) {
  const sb = getClient();
  const { data, error } = await sb.from("benchmark_scores")
    .select("*")
    .eq("run_id", runId)
    .order("stage_number", { ascending: true });
  if (error) throw error;
  return data;
}

/** Récupère la matrice d'un run */
async function getMatrixByRun(runId) {
  const sb = getClient();
  const { data, error } = await sb.from("orchestration_matrix")
    .select("*")
    .eq("run_id", runId)
    .order("stage_number", { ascending: true });
  if (error) throw error;
  return data;
}

module.exports = {
  createRun,
  updateRun,
  insertResponse,
  insertScore,
  insertMatrix,
  getScoresByRun,
  getMatrixByRun,
};
