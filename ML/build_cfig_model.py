"""
CFI-G (PSI-159, ACME) ignition model -- second trained model, numpy only.

Source: PSI-159_Experimental table_CFI-G_Normal Flames.csv (179 tests of gaseous
fuel flames, O2 up to ~85% -- the highest-oxygen microgravity tests in PSI).
Target: did the flame hot-ignite ("Hot ignition" Yes/No)?  A flammability-onset
question, the same kind the exploration atmosphere raises.
Features: O2 mole fraction before the test, pressure (bar), fuel (propane/ethane
vs butane). Fuel strings like "30% butane" are kept as their hydrocarbon family;
the dilution percentage is NOT modelled.

Same export shape as flexModel.json, consumed by src/cfigModel.js. No sklearn
(not installed): logistic regression is fitted with L2-regularised Newton steps.
Run: python3 build_cfig_model.py
"""
import json
import numpy as np
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'flame_in_freefall_data' / 'psi_data' / 'PSI-159' / 'Experimental table' / 'PSI-159_Experimental table_CFI-G_Normal Flames.csv'
URL = 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-159'

d = pd.read_csv(SRC, encoding='utf-8-sig')
d.columns = [c.strip() for c in d.columns]
d = d.rename(columns={'XO2 before test': 'o2', 'approx p (bar)': 'p_bar', 'Hot ignition': 'hot', 'Fuel': 'fuel_raw'})
d['source_row'] = np.arange(2, len(d) + 2)                    # CSV line number (header = line 1)
d['o2'] = pd.to_numeric(d['o2'], errors='coerce')
d['p_bar'] = pd.to_numeric(d['p_bar'], errors='coerce')
d['hot'] = d['hot'].astype(str).str.strip().str.lower().map({'yes': 1, 'no': 0})
fam = d['fuel_raw'].astype(str).str.lower()
d['fuel'] = np.select([fam.str.contains('butane'), fam.str.contains('propane'), fam.str.contains('ethane')], ['butane', 'propane', 'ethane'], 'other')
d = d[d.fuel != 'other'].dropna(subset=['o2', 'p_bar', 'hot']).copy()
d['o2_pct'] = d.o2 * 100
d['f_propane'] = (d.fuel == 'propane').astype(float)
d['f_ethane'] = (d.fuel == 'ethane').astype(float)
FEATURES = ['o2_pct', 'p_bar', 'f_propane', 'f_ethane']
print(f'{len(d)} usable tests; hot-ignition rate {d.hot.mean():.2f}')

def sigmoid(z): return 1 / (1 + np.exp(-z))

def fit(X, y, l2=1.0, iters=50):
    Xb = np.c_[np.ones(len(X)), X]; w = np.zeros(Xb.shape[1])
    R = np.eye(len(w)) * l2; R[0, 0] = 0
    for _ in range(iters):
        p = sigmoid(Xb @ w); W = p * (1 - p) + 1e-9
        g = Xb.T @ (p - y) + R @ w
        H = (Xb * W[:, None]).T @ Xb + R
        w_new = w - np.linalg.solve(H, g)
        if np.allclose(w, w_new, atol=1e-9): w = w_new; break
        w = w_new
    return w[0], w[1:]

def auc(y, s):
    pos, neg = s[y == 1], s[y == 0]
    return float(np.mean([(p > n) + 0.5 * (p == n) for p in pos for n in neg]))

X = d[FEATURES].to_numpy(float); y = d.hot.to_numpy(float)
rng = np.random.default_rng(42)
idx = rng.permutation(len(d)); cut = int(0.75 * len(d))
tr, te = idx[:cut], idx[cut:]
mean, scale = X[tr].mean(0), X[tr].std(0); scale[scale == 0] = 1
b, w = fit((X[tr] - mean) / scale, y[tr])
pt = sigmoid(((X[te] - mean) / scale) @ w + b)
metrics = {'n_train': int(len(tr)), 'n_test': int(len(te)), 'auc': round(auc(y[te], pt), 3),
           'accuracy': round(float(((pt > .5) == y[te]).mean()), 3), 'base_rate_hot_ignition': round(float(y.mean()), 3),
           'majority_class_accuracy': round(float(max(y.mean(), 1 - y.mean())), 3)}
# 5-fold CV AUC on all rows, so the single split is not the only evidence
folds = np.array_split(rng.permutation(len(d)), 5); cv = []
for k in range(5):
    t = folds[k]; r = np.concatenate([folds[j] for j in range(5) if j != k])
    m, s = X[r].mean(0), X[r].std(0); s[s == 0] = 1
    bb, ww = fit((X[r] - m) / s, y[r]); cv.append(auc(y[t], sigmoid(((X[t] - m) / s) @ ww + bb)))
metrics['cv5_auc_mean'] = round(float(np.mean(cv)), 3); metrics['cv5_auc_min'] = round(float(np.min(cv)), 3)
print(metrics)

# refit on all rows for the exported coefficients (metrics above are held-out)
mean, scale = X.mean(0), X.std(0); scale[scale == 0] = 1
b, w = fit((X - mean) / scale, y)
export = {
    'source': f'NASA PSI PSI-159 (ACME CFI-G), {len(d)} normal-flame tests, from {SRC.name}',
    'source_url': URL, 'source_file': SRC.name, 'generated_by': 'ML/build_cfig_model.py',
    'scope_note': 'Gaseous-fuel (propane/ethane/butane blends) flames on a spherical burner in microgravity. Not a solid-material flammability model; use as nearest-evidence comparison for high-oxygen conditions. Fuel dilution percentage is not modelled.',
    'target': 'hot ignition (yes/no)', 'features': FEATURES,
    'training_range': {f: [round(float(d[f].min()), 3), round(float(d[f].max()), 3)] for f in FEATURES},
    'classifier': {'intercept': float(b), 'coef': w.tolist(), 'scaler_mean': mean.tolist(), 'scaler_scale': scale.tolist(), 'metrics': metrics},
    'tests': [{'source_row': int(r.source_row), 'fuel': r.fuel_raw, 'o2_pct': round(float(r.o2_pct), 2), 'pressure_bar': round(float(r.p_bar), 3),
               'hot_ignition': bool(r.hot), 'source_url': URL} for r in d.itertuples()],
}
(ROOT / 'src' / 'cfigModel.json').write_text(json.dumps(export, indent=1))
print('wrote src/cfigModel.json', export['training_range'])
