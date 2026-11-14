# SI disclosure: written with Claude (Anthropic).
"""
CFI-G (PSI-159, ACME) ignition model -- second trained model, numpy only.

Sources (PSI-159 "Experimental table"):
  * CFI-G_Normal Flames.csv   -- 179 tests, O2 ~18-40 % (ambient atmosphere)
  * CFI-G_Inverse Flames.csv  -- 154 tests, O2 12-85 % (oxygen-nitrogen from the burner):
    the highest-oxygen microgravity tests in PSI.
Target: did the flame hot-ignite ("Hot ignition" Yes/No)?  A flammability-onset
question, the same kind the exploration atmosphere raises. Inverse-flame rows
marked "flash" (8) are ambiguous and left out.
Features: O2 mole fraction (%), pressure (bar), fuel family (propane/ethane vs
butane), and a normal/inverse flame-configuration flag. Fuel strings like
"30% butane" are kept as their hydrocarbon family; the dilution percentage is NOT
modelled. For normal flames O2 is the "XO2 before test" column; for inverse flames
it is "XO2" (the oxidiser stream), so the two are not the same physical quantity --
that is why the flame configuration is an explicit input and ranges are per type.

Same export shape as flexModel.json, consumed by src/cfigModel.js. No sklearn
(not installed): logistic regression is fitted with L2-regularised Newton steps.
Run: python3 build_cfig_model.py
"""
import json
import numpy as np
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TABLES = ROOT / 'flame_in_freefall_data' / 'psi_data' / 'PSI-159' / 'Experimental table'
SRC_N = TABLES / 'PSI-159_Experimental table_CFI-G_Normal Flames.csv'
SRC_I = TABLES / 'PSI-159_Experimental table_CFI-G_Inverse Flames.csv'
URL = 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-159'

def load(path, o2col, inverse):
    d = pd.read_csv(path, encoding='utf-8-sig')
    d.columns = [c.strip() for c in d.columns]
    d = d.rename(columns={o2col: 'o2', 'approx p (bar)': 'p_bar', 'Hot ignition': 'hot', 'Fuel': 'fuel_raw'})
    d['source_row'] = np.arange(2, len(d) + 2)                # CSV line number (header = line 1)
    d['inverse'] = float(inverse)
    d['source_file'] = path.name
    d['o2'] = pd.to_numeric(d['o2'], errors='coerce')
    d['p_bar'] = pd.to_numeric(d['p_bar'], errors='coerce')
    d['hot'] = d['hot'].astype(str).str.strip().str.lower().map({'yes': 1, 'no': 0})   # 'flash' -> NaN, dropped
    return d[['source_row', 'source_file', 'inverse', 'o2', 'p_bar', 'hot', 'fuel_raw']]

d = pd.concat([load(SRC_N, 'XO2 before test', False), load(SRC_I, 'XO2', True)], ignore_index=True)
fam = d['fuel_raw'].astype(str).str.lower()
d['fuel'] = np.select([fam.str.contains('butane'), fam.str.contains('propane'), fam.str.contains('ethane')], ['butane', 'propane', 'ethane'], 'other')
d = d[d.fuel != 'other'].dropna(subset=['o2', 'p_bar', 'hot']).copy()
d['o2_pct'] = d.o2 * 100
d['f_propane'] = (d.fuel == 'propane').astype(float)
d['f_ethane'] = (d.fuel == 'ethane').astype(float)
FEATURES = ['o2_pct', 'p_bar', 'f_propane', 'f_ethane', 'inverse']
print(f'{len(d)} usable tests ({int((d.inverse == 0).sum())} normal, {int(d.inverse.sum())} inverse); hot-ignition rate {d.hot.mean():.2f}')
for k, g in d.groupby('inverse'): print(' ', 'inverse' if k else 'normal', len(g), 'rows, hot-ignition rate', round(g.hot.mean(), 3))

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
# held-out skill separately for each flame configuration (the pooled number can hide a weak half)
inv_te = X[te][:, FEATURES.index('inverse')] == 1
by_type = {}
for name, m in (('normal', ~inv_te), ('inverse', inv_te)):
    yt, ptt = y[te][m], pt[m]
    by_type[name] = {'n_test': int(m.sum()), 'base_rate_hot_ignition': round(float(y[d.inverse.to_numpy() == (name == 'inverse')].mean()), 3),
                     'accuracy': round(float(((ptt > .5) == yt).mean()), 3), 'majority_class_accuracy': round(float(max(yt.mean(), 1 - yt.mean())), 3),
                     'auc': round(auc(yt, ptt), 3) if 0 < yt.sum() < len(yt) else None}
metrics['by_flame_type'] = by_type
metrics['cv5_auc_mean'] = round(float(np.mean(cv)), 3); metrics['cv5_auc_min'] = round(float(np.min(cv)), 3)
print(metrics)

# refit on all rows for the exported coefficients (metrics above are held-out)
mean, scale = X.mean(0), X.std(0); scale[scale == 0] = 1
b, w = fit((X - mean) / scale, y)
export = {
    'source': f'NASA PSI PSI-159 (ACME CFI-G), {len(d)} tests ({int((d.inverse == 0).sum())} normal-flame + {int(d.inverse.sum())} inverse-flame), from {SRC_N.name} and {SRC_I.name}',
    'source_url': URL, 'source_files': [SRC_N.name, SRC_I.name], 'generated_by': 'ML/build_cfig_model.py (written with Claude, Anthropic)',
    'scope_note': 'Gaseous-fuel (propane/ethane/butane blends) flames on a spherical burner in microgravity. Not a solid-material flammability model; use as nearest-evidence comparison for high-oxygen conditions. Fuel dilution percentage is not modelled. Inverse-flame O2 is the oxidiser-stream concentration, so predictions are only given within the tested range of each flame configuration.',
    'target': 'hot ignition (yes/no)', 'features': FEATURES,
    'training_range': {f: [round(float(d[f].min()), 3), round(float(d[f].max()), 3)] for f in ('o2_pct', 'p_bar')},
    'training_range_by_flame': {name: {f: [round(float(g[f].min()), 3), round(float(g[f].max()), 3)] for f in ('o2_pct', 'p_bar')}
                                for name, g in (('normal', d[d.inverse == 0]), ('inverse', d[d.inverse == 1]))},
    'classifier': {'intercept': float(b), 'coef': w.tolist(), 'scaler_mean': mean.tolist(), 'scaler_scale': scale.tolist(), 'metrics': metrics},
    'tests': [{'source_row': int(r.source_row), 'fuel': r.fuel_raw, 'o2_pct': round(float(r.o2_pct), 2), 'pressure_bar': round(float(r.p_bar), 3),
               'hot_ignition': bool(r.hot), 'flame': 'inverse' if r.inverse else 'normal', 'source_file': r.source_file, 'source_url': URL} for r in d.itertuples()],
}
(ROOT / 'src' / 'cfigModel.json').write_text(json.dumps(export, indent=1))
print('wrote src/cfigModel.json', export['training_range_by_flame'])
print(json.dumps(metrics, indent=1))
