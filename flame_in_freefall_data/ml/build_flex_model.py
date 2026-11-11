"""
FLEX (PSI-69) droplet-flame grounding pipeline.

Builds flex_tests_clean.csv / flex_tests_features.csv / feature_dictionary.md
(same pattern as ../ml/feature_engineering.ipynb) PLUS fits two real models on
the 274 individual FLEX droplet tests and exports them as plain JSON
coefficients consumable by client-side JS (src/flexModel.json) -- no backend,
nothing that can fail during a live demo.

Run: python3 build_flex_model.py
"""
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, confusion_matrix, r2_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parent.parent  # flame_in_freefall_data/
OUT = Path(__file__).resolve().parent          # flame_in_freefall_data/ml/
SITE_OUT = ROOT.parent / 'src' / 'flexModel.json'

# ---------------------------------------------------------------- 1. pivot
raw = pd.read_csv(ROOT / 'cleaned' / 'cleaned_values.csv')
flex = raw[(raw.psi_id == 'PSI-69') & (raw.row_kind == 'data')].copy()

KEEP = {
    'fuel': 'fuel',
    'o_initial_ambient_composition_mole_fraction': 'o2_frac',
    'n_initial_ambient_composition_mole_fraction': 'n2_frac',
    'co_initial_ambient_composition_mole_fraction': 'co2_frac',
    'he_initial_ambient_composition_mole_fraction': 'he_frac',
    'ambient_pressure_mmhg': 'pressure_mmhg',
    'droplet_initial_diameter_mm': 'droplet_diameter_mm',
    'burn_time_s': 'burn_time_s',
    'burning_rate_mm': 'burning_rate_k_mm2_s',       # d^2-law burning-rate constant
    'visible_flame_extinction_diameter_mm': 'extinction_diameter_mm',
}

wide = {}
for key, out_name in KEEP.items():
    sub = flex[flex.column_key == key][['source_row', 'raw_value', 'normalized_value', 'value_type']]
    sub = sub.rename(columns={'raw_value': f'{out_name}__raw', 'normalized_value': out_name, 'value_type': f'{out_name}__type'})
    wide[out_name] = sub.set_index('source_row')

df = pd.DataFrame(index=sorted(flex.source_row.unique()))
for out_name, sub in wide.items():
    df = df.join(sub[[f'{out_name}__raw', out_name, f'{out_name}__type']])
df.index.name = 'source_row'
df = df.reset_index()
print(f'pivoted {len(df)} FLEX tests')

# ---------------------------------------------------------------- 2. clean
# Target 1: did the flame self-extinguish before fuel was consumed?
#   - extinction_diameter_mm numeric  -> True  (it went out at a measurable droplet size > 0)
#   - extinction_diameter_mm__type == 'qualitative' (source literally marks "-") -> False (burned to completion)
#   - column missing for this row entirely -> unknown (excluded from training, kept in export)
df['self_extinguished'] = np.where(
    df['extinction_diameter_mm'].notna(), 1,
    np.where(df['extinction_diameter_mm__type'] == 'qualitative', 0, np.nan))

df['pressure_atm'] = pd.to_numeric(df['pressure_mmhg'], errors='coerce') / 760.0
df['o2_pct'] = pd.to_numeric(df['o2_frac'], errors='coerce') * 100
df['n2_pct'] = pd.to_numeric(df['n2_frac'], errors='coerce') * 100
df['he_pct'] = pd.to_numeric(df['he_frac'], errors='coerce') * 100
df['droplet_diameter_mm'] = pd.to_numeric(df['droplet_diameter_mm'], errors='coerce')
df['burning_rate_k_mm2_s'] = pd.to_numeric(df['burning_rate_k_mm2_s'], errors='coerce')
df['fuel'] = df['fuel__raw']
df['fuel_methanol'] = (df['fuel'] == 'Methanol').astype(int)
# physically meaningful combined feature: partial pressure of O2
df['o2_partial_pressure_atm'] = (df['o2_frac'].astype(float)) * df['pressure_atm']

for c in ['o2_pct', 'pressure_atm', 'droplet_diameter_mm', 'burning_rate_k_mm2_s', 'self_extinguished']:
    df[f'{c}_missing'] = df[c].isna()

clean_cols = ['source_row', 'fuel', 'fuel_methanol', 'o2_pct', 'n2_pct', 'he_pct', 'pressure_atm',
              'o2_partial_pressure_atm', 'droplet_diameter_mm', 'burning_rate_k_mm2_s',
              'extinction_diameter_mm', 'self_extinguished',
              'o2_pct_missing', 'pressure_atm_missing', 'droplet_diameter_mm_missing',
              'burning_rate_k_mm2_s_missing', 'self_extinguished_missing']
clean = df[clean_cols].copy()
clean.to_csv(OUT / 'flex_tests_clean.csv', index=False)
print(f'wrote flex_tests_clean.csv {clean.shape}; '
      f'self_extinguished known for {clean.self_extinguished.notna().sum()} / {len(clean)} tests')

# ---------------------------------------------------------------- 3. models
FEATURES = ['o2_pct', 'pressure_atm', 'o2_partial_pressure_atm', 'droplet_diameter_mm', 'fuel_methanol']

def fit_classifier():
    d = clean.dropna(subset=FEATURES + ['self_extinguished'])
    X, y = d[FEATURES].values, d['self_extinguished'].values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0, stratify=y)
    scaler = StandardScaler().fit(X_train)
    Xs_train, Xs_test = scaler.transform(X_train), scaler.transform(X_test)
    model = LogisticRegression(max_iter=1000).fit(Xs_train, y_train)
    pred = model.predict(Xs_test)
    proba = model.predict_proba(Xs_test)[:, 1]
    metrics = {
        'n_train': len(y_train), 'n_test': len(y_test),
        'accuracy': round(accuracy_score(y_test, pred), 3),
        'auc': round(roc_auc_score(y_test, proba), 3),
        'confusion_matrix': confusion_matrix(y_test, pred).tolist(),
        'base_rate_self_extinguish': round(float(y.mean()), 3),
    }
    print('classifier metrics:', metrics)
    return scaler, model, metrics

def fit_regressor():
    d = clean.dropna(subset=FEATURES + ['burning_rate_k_mm2_s'])
    X, y = d[FEATURES].values, d['burning_rate_k_mm2_s'].values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0)
    scaler = StandardScaler().fit(X_train)
    Xs_train, Xs_test = scaler.transform(X_train), scaler.transform(X_test)
    model = LinearRegression().fit(Xs_train, y_train)
    pred = model.predict(Xs_test)
    metrics = {
        'n_train': len(y_train), 'n_test': len(y_test),
        'r2': round(r2_score(y_test, pred), 3),
        'mae_mm2_s': round(mean_absolute_error(y_test, pred), 4),
    }
    print('regressor metrics:', metrics)
    return scaler, model, metrics

clf_scaler, clf_model, clf_metrics = fit_classifier()
reg_scaler, reg_model, reg_metrics = fit_regressor()

# ---------------------------------------------------------------- 4. export
export = {
    'source': 'NASA PSI PSI-69 (FLEX), 274 individual droplet-flame tests, cleaned from flame_in_freefall_data/cleaned/cleaned_values.csv',
    'generated_by': 'flame_in_freefall_data/ml/build_flex_model.py',
    'scope_note': 'Fitted on free-floating liquid-droplet flames (methanol/heptane). Physically distinct from the solid-sample lab model (labModel.js derive()) -- use as nearest-evidence comparison, not a drop-in replacement for the solid-sample curves.',
    'features': FEATURES,
    'classifier': {
        'target': 'self_extinguished (1 = flame went out before fuel was consumed, 0 = burned to completion)',
        'scaler_mean': clf_scaler.mean_.tolist(), 'scaler_scale': clf_scaler.scale_.tolist(),
        'coef': clf_model.coef_[0].tolist(), 'intercept': float(clf_model.intercept_[0]),
        'metrics': clf_metrics,
    },
    'regressor': {
        'target': 'burning_rate_k_mm2_s (d^2-law burning-rate constant K, mm^2/s)',
        'scaler_mean': reg_scaler.mean_.tolist(), 'scaler_scale': reg_scaler.scale_.tolist(),
        'coef': reg_model.coef_.tolist(), 'intercept': float(reg_model.intercept_),
        'metrics': reg_metrics,
    },
    'tests': clean.dropna(subset=['o2_pct', 'pressure_atm']).apply(lambda r: {
        'source_row': int(r.source_row), 'fuel': r.fuel,
        'o2_pct': round(float(r.o2_pct), 2), 'pressure_atm': round(float(r.pressure_atm), 3),
        'droplet_diameter_mm': None if pd.isna(r.droplet_diameter_mm) else round(float(r.droplet_diameter_mm), 2),
        'self_extinguished': None if pd.isna(r.self_extinguished) else bool(r.self_extinguished),
        'extinction_diameter_mm': None if pd.isna(r.extinction_diameter_mm) else round(float(r.extinction_diameter_mm), 2),
        'burning_rate_k_mm2_s': None if pd.isna(r.burning_rate_k_mm2_s) else round(float(r.burning_rate_k_mm2_s), 3),
    }, axis=1).tolist(),
}
SITE_OUT.write_text(json.dumps(export, indent=1))
print(f'wrote {SITE_OUT} with {len(export["tests"])} real tests embedded')

# feature dictionary for the cleaned FLEX table
lines = ['# Feature dictionary -- flex_tests_clean.csv (PSI-69 FLEX, 274 droplet tests)', '',
         '| column | notes |', '|---|---|',
         '| fuel | Methanol or Heptane |',
         '| fuel_methanol | 1 = Methanol, 0 = Heptane |',
         '| o2_pct | ambient O2 by volume, % (swept 12-34% across the test matrix) |',
         '| n2_pct / he_pct | diluent gas composition; He varies Lewis number/thermal conductivity in some sub-series |',
         '| pressure_atm | ambient pressure, converted from source mmHg |',
         '| o2_partial_pressure_atm | o2_frac * pressure_atm -- combines O2% and total pressure into one physically meaningful term |',
         '| droplet_diameter_mm | initial droplet diameter |',
         '| burning_rate_k_mm2_s | measured d^2-law burning-rate constant K |',
         '| extinction_diameter_mm | droplet diameter at which the flame self-extinguished; blank/NaN if it burned to completion |',
         '| self_extinguished | derived target: 1 if extinction_diameter_mm reported, 0 if source explicitly marks no early extinction, NaN if the column was not reported for that test |',
         '| *_missing | explicit missing flags paired with every numeric/derived column |']
(OUT / 'flex_feature_dictionary.md').write_text('\n'.join(lines))
print('wrote flex_feature_dictionary.md')
