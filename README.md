# PRISMO Benchmark — Agent Arbitre Vercel

## Déploiement en 5 minutes

### 1. Prérequis
- Compte Vercel (gratuit OK)
- Node.js installé localement
- Git installé

### 2. Initialiser le projet

```bash
cd prismo-vercel
npm install
```

### 3. Configurer les variables d'environnement

Dans le dashboard Vercel (Settings → Environment Variables), ou via CLI :

```bash
vercel env add SUPABASE_URL        # → https://hcdamiwdvusqclduughc.supabase.co
vercel env add SUPABASE_SERVICE_KEY # → ta clé service_role
vercel env add DEEPSEEK_API_KEY     # → sk-880029e...
vercel env add OPENAI_API_KEY       # → sk-proj-ernrn...
vercel env add ANTHROPIC_API_KEY    # → sk-ant-api03-...
vercel env add XAI_API_KEY          # → xai-JlFez...
```

### 4. Déployer

```bash
vercel --prod
```

### 5. Utilisation

#### Tester une seule épreuve :
```
GET https://ton-projet.vercel.app/api/run-stage?stage=1
```

#### Tester un seul provider sur une épreuve :
```
GET https://ton-projet.vercel.app/api/run-stage?stage=1&provider=DeepSeek
```

#### Lancer le benchmark complet (10 épreuves × 4 providers) :
```
GET https://ton-projet.vercel.app/api/run-benchmark
```
⚠️ Prend ~3-5 minutes (40 appels API + 40 évaluations)

#### Consulter les résultats :
```
GET https://ton-projet.vercel.app/api/results?run_id=run_20260317...
```

## Architecture

```
prismo-vercel/
├── api/
│   ├── run-benchmark.js   → Lance les 10 épreuves × 4 providers
│   ├── run-stage.js       → Lance 1 épreuve (test)
│   └── results.js         → Consulte les résultats
├── lib/
│   ├── providers.js       → Appels API unifiés (DeepSeek, OpenAI, Anthropic, xAI)
│   ├── stages.js          → Les 10 épreuves avec prompts
│   ├── evaluator.js       → Claude comme évaluateur indépendant
│   └── supabase.js        → Client Supabase
├── package.json
├── vercel.json            → Config (timeout 300s pour benchmark)
└── README.md
```

## Flux d'exécution

1. `/api/run-benchmark` crée un `run_id` dans `benchmark_runs`
2. Pour chaque épreuve × chaque provider :
   - Appel API au modèle → réponse sauvée dans `benchmark_responses`
   - Claude évalue la réponse → score sauvé dans `benchmark_scores`
3. Matrice d'orchestration calculée → sauvée dans `orchestration_matrix`
4. Run marqué "completed"

## Formule composite

```
Score = (accuracy + depth + structure) / 15 × 40%
      + hallucinations / 5 × 30%
      + speed_proxy / 5 × 30%
```
