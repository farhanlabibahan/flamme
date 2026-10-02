# How findings are ranked

Every finding gets a score from 0 to 100 **for each mission scenario** (`scenarios.json`):

```
score = 100 x (0.45 x Relevance + 0.35 x Severity + 0.20 x Evidence)
```

| Part | What it measures | How |
|---|---|---|
| **Relevance (45%)** | Do the test conditions match the mission? | 40% oxygen match + 25% pressure match + 35% gravity match. A value inside the tested range scores 1; it loses 0.1 per %-point of O2 and 0.2 per 0.1 atm outside the range. Gravity match = 1 - difference in g. Unknown conditions score 0.6. |
| **Severity (35%)** | How much it matters for crew safety | 3 = direct threat or removes a safety margin (toxic gas above limits, alarms too slow, flames that won't self-extinguish, ground tests not conservative); 2 = useful design information; 1 = background or unclear meaning. |
| **Evidence (20%)** | How much to trust it | Confidence (high 1.0, medium 0.7, low 0.4; high = 10+ tests or a clear published conclusion) x type (measured result or report conclusion 1.0; test-matrix coverage only 0.4). |

**Evidence gaps are never scored** - they are shown next to the ranking when they apply, e.g. *no test was run at lunar or Martian gravity*, so every Moon/Mars ranking is an extrapolation from microgravity and Earth data and scores lower.

## Scenarios
| Key | Mission | O2 | Pressure | Gravity |
|---|---|---|---|---|
| iss | ISS-like cabin | 21% | 1.0 atm | 0 g |
| exploration_ug | Exploration atmosphere in transit | 34% | 0.56 atm (8.2 psia) | 0 g |
| moon | Lunar surface habitat | 34% | 0.56 atm | 0.17 g |
| mars | Mars surface habitat | 34% | 0.56 atm | 0.38 g |

34% O2 at 8.2 psia is NASA's proposed exploration atmosphere; edit `scenarios.json` to test others.

## Why these weights
Relevance comes first because a finding from the wrong atmosphere can mislead. Severity is next because the dashboard's job is crew safety. Evidence is weighted lowest but still separates a 30-test result from a single observation. All weights are constants at the top of `rank_findings.py`, so they are easy to change - and the dashboard can expose them as sliders.

Run: `python3 findings/rank_findings.py` -> `findings/rankings.csv`
