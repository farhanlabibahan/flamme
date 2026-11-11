# Feature dictionary -- flex_tests_clean.csv (PSI-69 FLEX, 274 droplet tests)

| column | notes |
|---|---|
| fuel | Methanol or Heptane |
| fuel_methanol | 1 = Methanol, 0 = Heptane |
| o2_pct | ambient O2 by volume, % (swept 12-34% across the test matrix) |
| n2_pct / he_pct | diluent gas composition; He varies Lewis number/thermal conductivity in some sub-series |
| pressure_atm | ambient pressure, converted from source mmHg; one row (source_row 115) had a literal 0 mmHg reading, physically impossible for a sealed ambient test, and is set to missing rather than treated as near-vacuum |
| o2_partial_pressure_atm | o2_frac * pressure_atm -- combines O2% and total pressure into one physically meaningful term |
| droplet_diameter_mm | initial droplet diameter |
| burning_rate_k_mm2_s | measured d^2-law burning-rate constant K |
| extinction_diameter_mm | droplet diameter at which the flame self-extinguished; blank/NaN if it burned to completion |
| self_extinguished | derived target: 1 if extinction_diameter_mm reported, 0 if source explicitly marks no early extinction, NaN if the column was not reported for that test |
| *_missing | explicit missing flags paired with every numeric/derived column |