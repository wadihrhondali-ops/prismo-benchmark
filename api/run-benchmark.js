// api/run-benchmark.js
// Lance le benchmark COMPLET : 10 épreuves × 4 providers
// GET /api/run-benchmark

const { callProvider, PROVIDERS } = require("../lib/providers");
const { STAGES } = require("../lib/stages");
const { evaluateResponse } = require("../lib/evaluator");
const {
  createRun,
  updateRun,
  insertResponse,
  insertScore,
  insertMatrix,
} = require("../lib/supabase");

module.exports = async function handler(req, res) {
  const runId = `run_${new Date().toISOString().replace(/[-:T]/g, "").substring(0, 14)}`;
  const providerNames = Object.keys(PROVIDERS);

  try {
    // 1. Créer le run dans Supabase
    await createRun(
      runId,
      providerNames,
      Object.fromEntries(providerNames.map((p) => [p, PROVIDERS[p].model]))
    );

    const allScores = {}; // { stageNum: { provider: composite } }
    let totalCost = 0;
    let stagesCompleted = 0;

    // 2. Boucle sur les 10 épreuves
    for (const stage of STAGES) {
      console.log(`\n=== ÉPREUVE ${stage.number}: ${stage.name} ===`);
      allScores[stage.number] = {};

      for (const providerName of providerNames) {
        console.log(`  → ${providerName}...`);

        // Appel API
        const apiResult = await callProvider(providerName, stage.prompt);

        // Sauvegarder réponse
        const savedResp = await insertResponse({
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

        totalCost += apiResult.costUsd || 0;

        // Évaluer si succès
        if (apiResult.success && apiResult.text) {
          const evalResult = await evaluateResponse(
            stage.number,
            stage.name,
            stage.criteria,
            stage.prompt,
            apiResult.text
          );

          if (evalResult.success) {
            await insertScore({
              response_id: savedResp?.id || null,
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

            allScores[stage.number][providerName] = evalResult.composite;
          } else {
            allScores[stage.number][providerName] = 0;
          }
        } else {
          allScores[stage.number][providerName] = 0;
        }
      }

      stagesCompleted++;
      await updateRun(runId, {
        stages_completed: stagesCompleted,
        total_cost_usd: parseFloat(totalCost.toFixed(4)),
      });
    }

    // 3. Générer la matrice d'orchestration
    const matrix = [];
    for (const stage of STAGES) {
      const stageScores = allScores[stage.number] || {};
      const sorted = Object.entries(stageScores).sort((a, b) => b[1] - a[1]);

      const winner = sorted[0];
      const runnerUp = sorted[1];

      if (winner) {
        const row = {
          run_id: runId,
          stage_number: stage.number,
          stage_name: stage.name,
          winner_provider: winner[0],
          winner_model: PROVIDERS[winner[0]].model,
          winner_composite: winner[1],
          runner_up_provider: runnerUp?.[0] || null,
          runner_up_model: runnerUp ? PROVIDERS[runnerUp[0]].model : null,
          runner_up_composite: runnerUp?.[1] || null,
          cost_per_million_tokens:
            PROVIDERS[winner[0]].costPerMillionInput +
            PROVIDERS[winner[0]].costPerMillionOutput,
          justification: `Meilleur composite (${winner[1].toFixed(3)}) pour ${stage.name}`,
        };
        await insertMatrix(row);
        matrix.push(row);
      }
    }

    // 4. Finaliser le run
    await updateRun(runId, {
      status: "completed",
      stages_completed: 10,
      total_cost_usd: parseFloat(totalCost.toFixed(4)),
    });

    // 5. Calculer les moyennes par provider
    const averages = {};
    for (const provider of providerNames) {
      const scores = STAGES.map((s) => allScores[s.number]?.[provider] || 0);
      averages[provider] = parseFloat(
        (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3)
      );
    }

    return res.status(200).json({
      run_id: runId,
      status: "completed",
      total_cost_usd: parseFloat(totalCost.toFixed(4)),
      averages,
      matrix: matrix.map((m) => ({
        stage: m.stage_number,
        name: m.stage_name,
        winner: `${m.winner_provider} (${m.winner_model})`,
        score: m.winner_composite,
      })),
    });
  } catch (err) {
    console.error("run-benchmark error:", err);
    await updateRun(runId, { status: "failed", notes: err.message });
    return res.status(500).json({ error: err.message, run_id: runId });
  }
};
