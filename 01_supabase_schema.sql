-- ============================================================
-- PRISMO BENCHMARK — SCHEMA SUPABASE
-- Exécuter dans SQL Editor du dashboard Supabase
-- ============================================================

-- Table 1 : Réponses brutes des modèles
CREATE TABLE IF NOT EXISTS benchmark_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  run_id TEXT NOT NULL,                    -- identifiant unique du run (ex: "run_20260317_001")
  stage_number INT NOT NULL CHECK (stage_number BETWEEN 1 AND 10),
  stage_name TEXT NOT NULL,
  provider TEXT NOT NULL,                  -- DeepSeek | OpenAI | Anthropic | xAI
  model TEXT NOT NULL,                     -- V3.2 | GPT-4o-mini | Claude Haiku 4.5 | Grok-2
  prompt_sent TEXT NOT NULL,               -- le prompt exact envoyé
  response_text TEXT,                      -- la réponse brute du modèle
  tokens_input INT,
  tokens_output INT,
  latency_ms INT,
  cost_usd NUMERIC(10,6),                 -- coût réel de l'appel
  error TEXT                               -- null si succès, message si erreur
);

-- Table 2 : Scores attribués par l'évaluateur (Claude)
CREATE TABLE IF NOT EXISTS benchmark_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  response_id UUID REFERENCES benchmark_responses(id),
  run_id TEXT NOT NULL,
  stage_number INT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  -- Scores individuels (chacun sur 5)
  score_accuracy INT CHECK (score_accuracy BETWEEN 0 AND 5),
  score_depth INT CHECK (score_depth BETWEEN 0 AND 5),
  score_structure INT CHECK (score_structure BETWEEN 0 AND 5),
  score_hallucinations INT CHECK (score_hallucinations BETWEEN 0 AND 5),  -- 5 = aucune hallucination
  score_speed INT CHECK (score_speed BETWEEN 0 AND 5),
  -- Score composite calculé
  composite_score NUMERIC(5,3),
  -- Justification de l'évaluateur
  evaluator_notes TEXT
);

-- Table 3 : Matrice finale et recommandations
CREATE TABLE IF NOT EXISTS orchestration_matrix (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  run_id TEXT NOT NULL,
  stage_number INT NOT NULL,
  stage_name TEXT NOT NULL,
  winner_provider TEXT NOT NULL,
  winner_model TEXT NOT NULL,
  winner_composite NUMERIC(5,3),
  runner_up_provider TEXT,
  runner_up_model TEXT,
  runner_up_composite NUMERIC(5,3),
  cost_per_million_tokens NUMERIC(10,4),
  justification TEXT
);

-- Table 4 : Métadonnées des runs
CREATE TABLE IF NOT EXISTS benchmark_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending',           -- pending | running | completed | failed
  providers JSONB,                         -- ["DeepSeek", "OpenAI", "Anthropic", "xAI"]
  models JSONB,                            -- {"DeepSeek": "V3.2", ...}
  total_stages INT DEFAULT 10,
  stages_completed INT DEFAULT 0,
  total_cost_usd NUMERIC(10,4),
  notes TEXT
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_responses_run ON benchmark_responses(run_id);
CREATE INDEX IF NOT EXISTS idx_responses_stage ON benchmark_responses(stage_number);
CREATE INDEX IF NOT EXISTS idx_scores_run ON benchmark_scores(run_id);
CREATE INDEX IF NOT EXISTS idx_matrix_run ON orchestration_matrix(run_id);

-- Vue : résumé rapide par run
CREATE OR REPLACE VIEW benchmark_summary AS
SELECT 
  r.run_id,
  r.status,
  r.created_at,
  r.stages_completed,
  r.total_cost_usd,
  COUNT(DISTINCT s.stage_number) as stages_scored,
  json_object_agg(
    DISTINCT s.provider, 
    ROUND(AVG(s.composite_score)::numeric, 3)
  ) FILTER (WHERE s.composite_score IS NOT NULL) as avg_scores_by_provider
FROM benchmark_runs r
LEFT JOIN benchmark_scores s ON r.run_id = s.run_id
GROUP BY r.run_id, r.status, r.created_at, r.stages_completed, r.total_cost_usd;
