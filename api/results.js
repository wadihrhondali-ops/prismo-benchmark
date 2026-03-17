// api/results.js
// Récupère les résultats d'un run
// GET /api/results?run_id=run_20260317_001

const { getScoresByRun, getMatrixByRun } = require("../lib/supabase");

module.exports = async function handler(req, res) {
  try {
    const runId = req.query.run_id;
    if (!runId) {
      return res.status(400).json({ error: "run_id requis" });
    }

    const [scores, matrix] = await Promise.all([
      getScoresByRun(runId),
      getMatrixByRun(runId),
    ]);

    // Calculer moyennes par provider
    const byProvider = {};
    for (const s of scores) {
      if (!byProvider[s.provider]) byProvider[s.provider] = [];
      byProvider[s.provider].push(s.composite_score);
    }

    const averages = {};
    for (const [provider, composites] of Object.entries(byProvider)) {
      averages[provider] = parseFloat(
        (composites.reduce((a, b) => a + b, 0) / composites.length).toFixed(3)
      );
    }

    // Ranking global
    const ranking = Object.entries(averages)
      .sort((a, b) => b[1] - a[1])
      .map(([provider, avg], i) => ({
        rank: i + 1,
        provider,
        average_composite: avg,
      }));

    return res.status(200).json({
      run_id: runId,
      ranking,
      matrix: matrix.map((m) => ({
        stage: m.stage_number,
        name: m.stage_name,
        winner: m.winner_provider,
        model: m.winner_model,
        composite: parseFloat(m.winner_composite),
      })),
      detailed_scores: scores,
    });
  } catch (err) {
    console.error("results error:", err);
    return res.status(500).json({ error: err.message });
  }
};
