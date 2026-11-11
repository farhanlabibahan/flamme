# Feature dictionary — findings_features.csv

| column | type | notes |
|---|---|---|
| finding_id | categorical, 108 values |  |
| question | categorical, 5 values |  |
| theme | categorical, 9 values |  |
| psi_id | categorical, 20 values |  |
| experiment | categorical, 38 values |  |
| material_or_fuel | categorical, 73 values |  |
| condition | categorical, 96 values |  |
| o2_pct_min | numeric, range [12, 30.3] |  |
| o2_pct_max | numeric, range [15, 40] |  |
| o2_pct_mid | numeric, range [13.5, 32.5] | midpoint of reported O2 %% band |
| o2_pct_width | numeric, range [0, 19] | 0 = single reported value, >0 = swept range |
| o2_pct_missing | boolean | True if O2 %% was not reported for this finding |
| pressure_atm_min | numeric, range [0.4, 2.96] |  |
| pressure_atm_max | numeric, range [0.49, 5] |  |
| pressure_atm_mid | numeric, range [0.49, 2.96] | midpoint of reported pressure band, atm |
| pressure_atm_width | numeric, range [0, 4.25] |  |
| pressure_atm_missing | boolean |  |
| flow_cm_s | categorical, 12 values |  |
| flow_cm_s_missing | boolean |  |
| gravity | categorical, 14 values |  |
| gravity_primary | categorical, 2 values | parsed regime: microgravity / earth_1g / unknown |
| gravity_platform | categorical, 4 values |  |
| is_comparison | boolean | row reports microgravity AND a baseline side by side |
| metric | categorical, 63 values |  |
| value_numeric | numeric, range [0, 981] | the reported metric value, parsed to float |
| value_is_missing | boolean |  |
| unit_raw | categorical, 18 values |  |
| unit_clean | categorical, 11 values | controlled-vocabulary unit; unit_raw keeps the original text |
| n_tests | categorical, 35 values |  |
| n_tests_missing | boolean |  |
| evidence_type | categorical, 3 values |  |
| confidence | categorical, 3 values |  |
| source_file | categorical, 39 values |  |
| caveat | categorical, 8 values |  |
| page | categorical, 29 values |  |
| quote | categorical, 52 values |  |
| confidence_ordinal | numeric, range [0, 2] | low=0, medium=1, high=2 |
| gravity_earth_1g | boolean |  |
| gravity_microgravity | boolean |  |
| evtype_measured_outcome | boolean |  |
| evtype_report_extracted | boolean |  |
| evtype_test_coverage | boolean |  |
| theme_Droplet / liquid-fuel fires | boolean |  |
| theme_Gas flames / cool flames | boolean |  |
| theme_Gas flames / exploration atmospheres | boolean |  |
| theme_Gas flames / extinction | boolean |  |
| theme_Gas flames / soot | boolean |  |
| theme_Large-scale spacecraft fire | boolean |  |
| theme_Smoke & detection | boolean |  |
| theme_Solid-material flammability | boolean |  |
| theme_Suppression / ventilation | boolean |  |
| material_freq | numeric, range [0.00926, 0.0741] | frequency-encoded material_or_fuel (share of all rows) |
| is_comparison_int | numeric, range [0, 1] |  |
| n_tests_log1p | numeric, range [0.693, 6.15] | log1p of number of individual tests behind this finding |