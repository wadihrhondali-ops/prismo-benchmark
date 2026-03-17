// api/run-stage.js
// Lance UNE épreuve pour tous les providers (ou un seul)
// GET /api/run-stage?stage=1&provider=DeepSeek (optionnel)

const { callProvider, PROVIDERS } = require("../lib/providers");
const { STAGES } = require("../lib/stages");
const { evaluateResponse } = require("../lib/evaluator");
const { insertResponse, insertScore } = require("../lib/supabase");

module.exports = async function handler(req, res) {
  try {
    const stageNum = parseInt(req.query.stage);
    const singleProvider = req.query.provider || null;
    const runId = req.query.run_id || `test_${Date.now()}`;

    if (!stageNum || stageNum < 1 || stageNum > 10) {
      return res.status(400).json({ error: "stage doit être entre 1 et 10" });
    }

    const stage = STAGES[stageNum - 1];
    const providers = singleProvider ? [singleProvider] : Object.keys(PROVIDERS);
    const results = [];

    for (const providerName of providers) {
      console.log(`[Stage ${stageNum}] Appel ${providerName}...`);

      // 1. Appel au modèle
      const apiResult = await callProvider(providerName, stage.prompt);

      // 2. Sauvegarder la réponse brute dans Supabase
      const savedResponse = await insertResponse({
        run_id: runId,
        stage_number: stage.number,
        stage_name: stage.name,
        provider: providerName,
        model: PROVIDERS[providerName].model,
        prompt_sent: stage.prompt,
        response_text: apiResult.text,
        tokens_input: apiResult.tokensInput,
        tokens_output: apiResult.tokensOutput,
        latency_ms: apiResult.latencyMs,
        cost_usd: apiResult.costUsd,
        error: apiResult.error,
      });

      let evalResult = null;

      // 3. Si la réponse est OK, évaluer avec Claude
      if (apiResult.success && apiResult.text) {
        console.log(`[Stage ${stageNum}] Évaluation ${providerName}...`);
        evalResult = await evaluateResponse(
          stage.number,
          stage.name,
          stage.criteria,
          stage.prompt,
          apiResult.text
        );

        // 4. Sauvegarder le score dans Supabase
        if (evalResult.success) {
          await insertScore({
            response_id: savedResponse?.id || null,
            run_id: runId,
            stage_number: stage.number,
            provider: providerName,
            model: PROVIDERS[providerName].model,
            score_accuracy: evalResult.scores.accuracy,
            score_depth: evalResult.scores.depth,
            score_structure: evalResult.scores.structure,
            score_hallucinations: evalResult.scores.hallucinations,
            score_speed: evalResult.scores.speed,
            composite_score: evalResult.composite,
            evaluator_notes: evalResult.notes,
          });
        }
      }

      results.push({
        provider: providerName,
        model: PROVIDERS[providerName].model,
        api: {
          success: apiResult.success,
          latencyMs: apiResult.latencyMs,
          tokensInput: apiResult.tokensInput,
          tokensOutput: apiResult.tokensOutput,
          costUsd: apiResult.costUsd,
          error: apiResult.error,
          responsePreview: apiResult.text?.substring(0, 200) || null,
        },
        evaluation: evalResult
          ? {
              success: evalResult.success,
              scores: evalResult.scores,
              composite: evalResult.composite,
              notes: evalResult.notes,
            }
          : null,
      });
    }

    return res.status(200).json({
      stage: stageNum,
      name: stage.name,
      run_id: runId,
      results,
    });
  } catch (err) {
    console.error("run-stage error:", err);
    return res.status(500).json({ error: err.message });
  }
};
