// lib/evaluator.js
// Évaluateur indépendant : utilise Claude (Sonnet) pour noter les réponses

const EVAL_MODEL = "claude-sonnet-4-20250514";

/**
 * Évalue une réponse avec Claude comme juge indépendant
 * Retourne des scores sur 5 + un composite
 */
async function evaluateResponse(stageNumber, stageName, criteria, prompt, responseText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante pour l'évaluateur");

  const evalPrompt = `Tu es un évaluateur académique expert et impartial dans le cadre du benchmark PRISMO.

CONTEXTE :
- Épreuve ${stageNumber} : ${stageName}
- Critères d'évaluation : ${criteria.join(", ")}

PROMPT ORIGINAL ENVOYÉ AU MODÈLE :
${prompt}

RÉPONSE DU MODÈLE À ÉVALUER :
${responseText}

CONSIGNES D'ÉVALUATION :
Évalue cette réponse sur 5 dimensions, chacune notée de 0 à 5 :

1. accuracy (exactitude/fidélité) : La réponse est-elle factuelle et correcte ?
2. depth (profondeur) : L'analyse est-elle approfondie ou superficielle ?
3. structure (qualité structurelle) : La réponse est-elle bien organisée et claire ?
4. hallucinations (inversé : 5 = aucune hallucination, 0 = très halluciné) : Y a-t-il des informations inventées ou fausses ?
5. speed_proxy (qualité/concision) : La réponse est-elle efficace sans verbiage inutile ?

RÉPONDS UNIQUEMENT en JSON strict, sans markdown, sans backticks :
{"accuracy":X,"depth":X,"structure":X,"hallucinations":X,"speed_proxy":X,"notes":"justification en 2 phrases max"}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: EVAL_MODEL,
        max_tokens: 500,
        temperature: 0,
        messages: [{ role: "user", content: evalPrompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Erreur évaluateur");
    }

    const rawText = data.content?.[0]?.text || "";

    // Parse le JSON — nettoyer si besoin
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const scores = JSON.parse(cleaned);

    // Calcul du composite : qualité (40%) + hallucinations (30%) + coût-proxy (30%)
    const qualityAvg = (scores.accuracy + scores.depth + scores.structure) / 3;
    const composite =
      (qualityAvg / 5) * 0.4 +
      (scores.hallucinations / 5) * 0.3 +
      (scores.speed_proxy / 5) * 0.3;

    return {
      success: true,
      scores: {
        accuracy: scores.accuracy,
        depth: scores.depth,
        structure: scores.structure,
        hallucinations: scores.hallucinations,
        speed: scores.speed_proxy,
      },
      composite: parseFloat(composite.toFixed(3)),
      notes: scores.notes || "",
    };
  } catch (err) {
    return {
      success: false,
      scores: { accuracy: 0, depth: 0, structure: 0, hallucinations: 0, speed: 0 },
      composite: 0,
      notes: `Erreur évaluation: ${err.message}`,
    };
  }
}

module.exports = { evaluateResponse };
