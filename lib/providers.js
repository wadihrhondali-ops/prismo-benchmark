// lib/providers.js
// Appels API unifiés pour DeepSeek, OpenAI, Anthropic, xAI

const PROVIDERS = {
  DeepSeek: {
    model: "deepseek-chat",
    endpoint: "https://api.deepseek.com/chat/completions",
    keyEnv: "DEEPSEEK_API_KEY",
    format: "openai", // format compatible OpenAI
    costPerMillionInput: 0.14,
    costPerMillionOutput: 0.28,
  },
  OpenAI: {
    model: "gpt-4o-mini",
    endpoint: "https://api.openai.com/v1/chat/completions",
    keyEnv: "OPENAI_API_KEY",
    format: "openai",
    costPerMillionInput: 0.15,
    costPerMillionOutput: 0.60,
  },
  Anthropic: {
    model: "claude-haiku-4-5-20251001",
    endpoint: "https://api.anthropic.com/v1/messages",
    keyEnv: "ANTHROPIC_API_KEY",
    format: "anthropic",
    costPerMillionInput: 0.80,
    costPerMillionOutput: 4.00,
  },
  xAI: {
    model: "grok-3-mini-beta",
    endpoint: "https://api.x.ai/v1/chat/completions",
    keyEnv: "XAI_API_KEY",
    format: "openai", 
    costPerMillionInput: 0.30,
    costPerMillionOutput: 0.50,
  },
};

/**
 * Appelle un modèle et retourne la réponse + métadonnées
 */
async function callProvider(providerName, prompt) {
  const config = PROVIDERS[providerName];
  if (!config) throw new Error(`Provider inconnu: ${providerName}`);

  const apiKey = process.env[config.keyEnv];
  if (!apiKey) throw new Error(`Clé API manquante: ${config.keyEnv}`);

  const startTime = Date.now();

  try {
    let response, data, text, tokensIn, tokensOut;

    if (config.format === "openai") {
      // Format OpenAI (DeepSeek, OpenAI, xAI)
      response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || JSON.stringify(data));
      }

      text = data.choices?.[0]?.message?.content || "";
      tokensIn = data.usage?.prompt_tokens || 0;
      tokensOut = data.usage?.completion_tokens || 0;

    } else if (config.format === "anthropic") {
      // Format Anthropic
      response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      });

      data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || JSON.stringify(data));
      }

      text = data.content?.[0]?.text || "";
      tokensIn = data.usage?.input_tokens || 0;
      tokensOut = data.usage?.output_tokens || 0;
    }

    const latencyMs = Date.now() - startTime;
    const costUsd =
      (tokensIn / 1_000_000) * config.costPerMillionInput +
      (tokensOut / 1_000_000) * config.costPerMillionOutput;

    return {
      success: true,
      text,
      tokensInput: tokensIn,
      tokensOutput: tokensOut,
      latencyMs,
      costUsd: parseFloat(costUsd.toFixed(6)),
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      text: null,
      tokensInput: 0,
      tokensOutput: 0,
      latencyMs: Date.now() - startTime,
      costUsd: 0,
      error: err.message,
    };
  }
}

module.exports = { PROVIDERS, callProvider };
