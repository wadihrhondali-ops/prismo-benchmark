// lib/stages.js
// Les 10 épreuves du benchmark PRISMO avec prompts standardisés

const STAGES = [
  {
    number: 1,
    name: "Compression et résumé",
    prompt: `Résume le texte suivant en 150 mots maximum sans perdre les concepts clés.

TEXTE À RÉSUMER :
L'attachement désorganisé est un pattern relationnel identifié par Mary Main et Judith Solomon dans les années 1980, à partir des travaux fondateurs de John Bowlby et Mary Ainsworth sur la théorie de l'attachement. Contrairement aux styles sécure, anxieux ou évitant, l'attachement désorganisé se caractérise par l'absence de stratégie cohérente face au stress. L'enfant présente des comportements contradictoires : il peut simultanément chercher la proximité du parent et s'en détourner, figer sur place, ou manifester des mouvements stéréotypés. Ce pattern est fortement associé à des expériences de maltraitance, de négligence, ou à un parent lui-même non résolu par rapport à un traumatisme ou un deuil. Sur le plan neurobiologique, l'attachement désorganisé est corrélé à une dysrégulation de l'axe hypothalamo-hypophyso-surrénalien (HPA), entraînant des réponses au stress atypiques. Les études longitudinales montrent que ce style d'attachement est un facteur de risque majeur pour le développement de troubles dissociatifs, de troubles de la personnalité borderline, et de difficultés de régulation émotionnelle à l'âge adulte. La méta-analyse de van IJzendoorn et al. (1999) a établi une prévalence d'environ 15% dans les populations normatives, mais pouvant atteindre 80% dans les populations cliniques à haut risque. Les interventions thérapeutiques ciblant ce pattern incluent la thérapie basée sur la mentalisation (MBT), la psychothérapie parent-enfant, et l'EMDR pour le traitement des traumatismes sous-jacents.`,
    criteria: ["fidélité", "compression", "structure"],
  },
  {
    number: 2,
    name: "Recherche documentaire",
    prompt: `Trouve 5 articles scientifiques publiés sur le lien entre :
- attachement désorganisé (disorganized attachment)
- régulation émotionnelle (emotion regulation)

Pour chaque article, fournis :
1. Auteurs et année
2. Titre exact
3. Journal de publication
4. Résumé en 2 phrases des résultats principaux

IMPORTANT : Ne cite QUE des articles réels et vérifiables. Si tu n'es pas sûr qu'un article existe, dis-le explicitement.`,
    criteria: ["exactitude", "hallucinations", "pertinence"],
  },
  {
    number: 3,
    name: "Raisonnement logique",
    prompt: `Analyse la validité logique de ce raisonnement :

Prémisse 1 : L'attachement désorganisé (A) entraîne une dysrégulation émotionnelle (B).
Prémisse 2 : La dysrégulation émotionnelle (B) favorise les conduites à risque (C).
Prémisse 3 : Les conduites à risque (C) augmentent la probabilité de traumatisme (D).
Conclusion : Donc l'attachement désorganisé (A) entraîne directement le traumatisme (D).

Questions :
1. Ce raisonnement est-il logiquement valide ? Pourquoi ?
2. Quels biais ou erreurs logiques identifie-tu ?
3. Quelles conditions manquent pour que la conclusion soit robuste ?
4. Propose une reformulation plus rigoureuse de la conclusion.`,
    criteria: ["cohérence logique", "identification des biais", "rigueur"],
  },
  {
    number: 4,
    name: "Critique méthodologique",
    prompt: `Critique la méthodologie suivante d'une revue conceptuelle :

MÉTHODOLOGIE DÉCRITE :
"Nous avons effectué une recherche sur Google Scholar et PubMed avec les mots-clés 'disorganized attachment' ET 'emotion regulation'. Nous avons retenu les 30 premiers articles pertinents. Les critères d'inclusion étaient : articles en anglais, publiés après 2000. Nous avons exclu les articles non accessibles en texte intégral. L'analyse a été réalisée par un seul chercheur qui a extrait les thèmes principaux."

Fournis :
1. Les forces de cette méthodologie
2. Les faiblesses et biais potentiels (minimum 5)
3. Des recommandations concrètes d'amélioration
4. Un niveau de confiance global (faible/moyen/élevé) avec justification`,
    criteria: ["profondeur critique", "niveau académique", "exhaustivité"],
  },
  {
    number: 5,
    name: "Structuration académique",
    prompt: `Transforme ce texte brut en plan académique structuré pour un mémoire de Master 2 en psychologie clinique :

TEXTE BRUT :
"L'attachement désorganisé c'est quand les enfants ne savent pas comment réagir avec leurs parents. Ça vient souvent de maltraitance. Après quand ils grandissent ça donne des problèmes de régulation émotionnelle et parfois des troubles de personnalité. Il y a des thérapies qui marchent comme la MBT et l'EMDR. Les études montrent que c'est assez fréquent surtout dans les populations à risque. Bowlby et Ainsworth ont commencé les recherches sur l'attachement et Main a découvert le type désorganisé."

Produis :
1. Un titre de mémoire académique
2. Un plan détaillé (parties, chapitres, sous-chapitres)
3. Pour chaque section, 1-2 phrases décrivant le contenu attendu`,
    criteria: ["hiérarchie", "clarté", "exhaustivité académique"],
  },
  {
    number: 6,
    name: "Extraction d'information",
    prompt: `Extrais de manière structurée les éléments suivants du texte ci-dessous :

TEXTE :
"Dans leur étude longitudinale de 2018, Lyons-Ruth et al. ont suivi 120 dyades mère-enfant pendant 20 ans. Les enfants présentant un attachement désorganisé à 18 mois (évalué par la Situation Étrange d'Ainsworth) montraient à l'âge adulte (25 ans) des scores significativement plus élevés sur l'échelle de dysrégulation émotionnelle (DERS, M=98.3, SD=14.2 vs M=72.1, SD=11.8, p<.001, d=2.01). Le modèle de régression hiérarchique expliquait 34% de la variance (R²=.34). Les variables médiatrices identifiées étaient la dissociation (β=.28, p<.01) et la mentalisation (β=-.31, p<.001)."

EXTRAIS :
- Variables indépendantes
- Variables dépendantes
- Variables médiatrices
- Taille d'échantillon
- Durée de suivi
- Instruments de mesure
- Résultats statistiques clés (avec valeurs)
- Taille d'effet`,
    criteria: ["précision", "exhaustivité", "format structuré"],
  },
  {
    number: 7,
    name: "Génération de questions de recherche",
    prompt: `À partir du sujet "Attachement désorganisé et régulation émotionnelle", génère :

1. 3 questions de recherche pour une revue systématique
2. 3 hypothèses testables (H1, H2, H3) avec variables opérationnalisées
3. Pour chaque hypothèse, propose un design méthodologique adapté (type d'étude, échantillon, outils de mesure)
4. Identifie 2 lacunes dans la littérature actuelle qui justifieraient une nouvelle étude

Sois précis, opérationnel et ancré dans la littérature existante.`,
    criteria: ["pertinence", "originalité", "faisabilité méthodologique"],
  },
  {
    number: 8,
    name: "Formatage structuré",
    prompt: `Convertis les données suivantes en TROIS formats différents :

DONNÉES BRUTES :
Étude 1: Lyons-Ruth 2018, N=120, attachement désorganisé → dysrégulation (d=2.01)
Étude 2: Duschinsky 2020, N=85, attachement désorganisé → dissociation (d=1.45)  
Étude 3: Granqvist 2017, N=200, attachement désorganisé → trouble personnalité (OR=3.8)
Étude 4: Hesse & Main 2006, N=150, transmission intergénérationnelle (r=.65)
Étude 5: van IJzendoorn 1999, méta-analyse K=80, prévalence 15% (pop. normative)

FORMAT 1 : Tableau Markdown avec colonnes (Auteur | Année | N | Variable | Effet | Taille d'effet)
FORMAT 2 : JSON structuré avec nested objects
FORMAT 3 : Résumé narratif académique (1 paragraphe, style APA)`,
    criteria: ["exactitude format", "cohérence", "lisibilité"],
  },
  {
    number: 9,
    name: "Robustesse à l'ambiguïté",
    prompt: `Réponds à cette demande volontairement ambiguë :

"Parle-moi de l'attachement et de comment ça affecte les gens."

CONSIGNES :
1. Identifie les ambiguïtés dans la demande (minimum 3)
2. Formule des questions de clarification que tu poserais
3. Malgré l'ambiguïté, fournis une réponse structurée et utile
4. Indique clairement tes hypothèses de travail et les limites de ta réponse
5. Évalue ton propre niveau de certitude pour chaque affirmation (élevé/moyen/faible)`,
    criteria: ["identification ambiguïtés", "gestion incertitude", "qualité malgré ambiguïté"],
  },
  {
    number: 10,
    name: "Efficacité pipeline",
    prompt: `Tâche de traitement rapide et économique :

Classe chacun des 10 termes suivants dans la catégorie appropriée (A, B ou C) :

Catégorie A : Concepts théoriques de l'attachement
Catégorie B : Outils de mesure / instruments
Catégorie C : Interventions thérapeutiques

Termes :
1. Modèle interne opérant
2. Adult Attachment Interview (AAI)
3. EMDR
4. Base de sécurité
5. Experiences in Close Relationships (ECR)
6. Thérapie basée sur la mentalisation (MBT)
7. Situation Étrange
8. Sensibilité maternelle
9. Circle of Security
10. Strange Situation Classification

Réponds UNIQUEMENT avec le format : "1:A, 2:B, ..." — rien d'autre.`,
    criteria: ["exactitude", "concision", "respect format"],
  },
];

module.exports = { STAGES };
