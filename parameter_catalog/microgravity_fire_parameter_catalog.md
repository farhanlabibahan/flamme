# Microgravity Fire Safety Parameter Catalog

**Project:** Flame in Freefall - AI-Powered Fire Safety Insights from Microgravity Combustion Data  
**Purpose:** Canonical parameter ontology, dataset discovery guide, and comparison framework  
**Version:** 1.0  
**Last updated:** 2026-10-01  
**Status:** Editable research document - not a flight-safety standard

---

## Executive summary

NASA microgravity combustion data is distributed across investigation pages, experimental tables, sensor logs, videos, images, reports, and publications. The same physical idea is often represented by different names, units, or file structures. This catalog provides one consistent vocabulary so that data can be found, normalized, compared, ranked, and explained without erasing scientifically important differences.

The catalog separates every record into three layers:

| Layer | Meaning | Examples |
|---|---|---|
| Controlled inputs | Conditions selected or imposed during a test | gravity, pressure, oxygen, airflow, material, geometry, ignition |
| Measured outputs | What happened during or after combustion | ignition delay, flame spread, temperature, smoke, extinction |
| Evidence context | Why a result can or cannot be trusted and compared | instrument, calibration, source, uncertainty, processing, domain shift |

The recommended storage hierarchy is:

```text
Investigation
  -> Experiment or test
      -> Controlled inputs
      -> Measured outputs
      -> Evidence context
      -> Mission interpretation (derived, never treated as raw data)
```

The most important design rule is: **search by scientific concept, compare through canonical units, and retain the original NASA evidence.**

---

## 1. How to use this catalog

Use the catalog for four related tasks:

1. **Dataset discovery:** tag every investigation by the parameter groups it contains.
2. **Schema normalization:** map raw column names and metadata to canonical parameter names.
3. **Scientific comparison:** compare only records that pass explicit compatibility checks.
4. **Decision support:** produce mission-relevant evidence cards that distinguish known, inferred, and unknown information.

For each imported value, preserve both the original and normalized representation:

```json
{
  "parameter": "flow_velocity",
  "value": 20.0,
  "unit": "cm/s",
  "original_name": "Air Speed",
  "original_value": 0.2,
  "original_unit": "m/s",
  "measurement_role": "controlled_input",
  "source_test_id": "SAFFIRE-I-S1",
  "source_file": "telemetry.csv",
  "uncertainty": 0.8,
  "uncertainty_unit": "cm/s",
  "processing_method": "unit_conversion",
  "confidence": 0.96
}
```

Never overwrite the original NASA field or value during normalization.

---

## 2. Sorting system

Each parameter receives four independent labels. This avoids forcing one parameter into a single rigid folder.

| Sorting axis | Allowed values | Purpose |
|---|---|---|
| Evidence role | controlled_input, measured_output, derived_output, context_metadata | Separates causes, observations, calculations, and metadata |
| Physical domain | gravity, atmosphere, flow, material, ignition, combustion, thermal, smoke, detection, suppression | Supports scientific filtering |
| Data shape | scalar, category, vector, time_series, image, video, spectrum, document | Selects processing and visualization methods |
| Evidence level | raw, calibrated, processed, reported, modeled, AI_extracted | Prevents derived values from being mistaken for measurements |

### 2.1 Parameter naming convention

- Use lowercase `snake_case`.
- Use one physical meaning per canonical name.
- Add a suffix only when it prevents ambiguity: `_rate`, `_fraction`, `_time`, `_temperature`, `_velocity`.
- Do not embed units in the parameter name.
- Store units in a separate field.
- Use controlled vocabularies for categories.
- Use identifiers rather than filenames as primary keys.

### 2.2 Required record identifiers

Every record should be traceable through this key chain:

```text
investigation_id -> experiment_id -> test_id -> observation_id
```

---

## 3. Group index

| Code | Group | Role | Primary search question |
|---|---|---|---|
| G01 | Provenance and identity | Context | Where did this evidence come from? |
| G02 | Mission and operational scenario | Context/derived | Where might the evidence be applied? |
| G03 | Gravity and platform dynamics | Input/context | What gravity environment existed? |
| G04 | Atmosphere and ambient conditions | Input | What gas environment surrounded the fire? |
| G05 | Flow, ventilation, and confinement | Input | How were oxidizer and products transported? |
| G06 | Material and fuel properties | Input | What was burning? |
| G07 | Specimen geometry and configuration | Input | In what form and arrangement did it burn? |
| G08 | Ignition and external exposure | Input/output | How was combustion initiated? |
| G09 | Flame propagation and burning behavior | Output | How did the fire develop? |
| G10 | Thermal and energy behavior | Output | What heat and temperature were produced? |
| G11 | Smoke, aerosol, and gas products | Output | What products and crew hazards were generated? |
| G12 | Detection and alarm performance | Output | How quickly and reliably was the fire detected? |
| G13 | Suppression, extinction, and recovery | Input/output | How was the fire controlled and what remained? |
| G14 | Instrumentation and synchronization | Context | How were observations collected? |
| G15 | Data quality, uncertainty, and comparability | Context/derived | Can this evidence be trusted and compared? |
| G16 | Derived safety intelligence | Derived | What decision-relevant conclusion is supported? |

---

## 4. G01 - Provenance and identity

This group makes every observation findable, citable, and reproducible.

| Canonical parameter | Type | Common aliases | Description |
|---|---|---|---|
| investigation_id | string | PSI ID, study ID, project ID | Stable repository-level identifier |
| investigation_name | string | project, campaign, investigation | Full investigation title |
| investigation_acronym | category | acronym, short name | BASS, FLEX, SAFFIRE, SAME, ACME, and similar |
| experiment_id | string | experiment, configuration ID | Identifier below investigation level |
| test_id | string | run ID, burn number, trial, sample test | Smallest repeatable experimental event |
| observation_id | string | measurement ID, record ID | Unique observation identifier |
| platform | category | flight platform, facility | ISS, Cygnus, drop tower, aircraft, ground chamber |
| facility | string | apparatus, rack, chamber | CIR, MSG, MDCA, wind tunnel, test cell |
| test_date | date/time | run date, GMT, timestamp | When the test occurred |
| principal_investigator | string | PI, research lead | Responsible investigator |
| sponsoring_agency | string | agency, sponsor | NASA or partner organization |
| nasa_center | string | center, institution | Responsible NASA center |
| dataset_version | string | revision, release | Version of the source dataset |
| source_doi | string | DOI, persistent ID | Stable citation identifier |
| source_url | URL | landing page, download URL | Source location |
| source_file | string | filename, asset | File containing the observation |
| source_file_version | string | file revision | Version of the individual file |
| data_level | category | raw, processed, analyzed | Maturity of the data |
| license | category | rights, usage terms | Reuse license |
| related_investigation | list | related PSI, predecessor | Linked investigations |

Recommended data levels: `raw`, `calibrated`, `processed`, `derived`, `modeled`, `reported_summary`.

---

## 5. G02 - Mission and operational scenario

Mission fields describe a target use case. They must not be presented as if they were measured during a laboratory test.

| Canonical parameter | Type | Example values | Notes |
|---|---|---|---|
| destination | category | ISS, Gateway, Moon, Mars, transit | Mission destination or environment |
| mission_phase | category | launch, cruise, docking, surface, EVA prep | Operational phase |
| habitat_type | category | spacecraft, module, lander, laboratory | Enclosure type |
| operational_state | category | crewed, uncrewed, dormant, emergency | System state |
| mission_duration | duration | days, months, years | Exposure and logistics horizon |
| crew_count | integer | 0 to mission maximum | Number of exposed crew |
| abort_capability | category | immediate, delayed, unavailable | Consequence modifier |
| response_delay | duration | seconds or minutes | Expected response time |
| fire_location | category | cabin, rack, avionics, storage, duct | Operational location |
| system_criticality | ordinal | low, medium, high, mission critical | Consequence classification |
| available_suppressant | list | CO2, water mist, inert gas | Available response resources |
| post_fire_filtration | category | none, limited, full | Cleanup capability |
| repairability | category | replaceable, repairable, nonrepairable | Recovery constraint |

Mission scenario records should be linked to experimental evidence through a separate `scenario_evidence_link` table containing similarity and domain-shift values.

---

## 6. G03 - Gravity and platform dynamics

| Canonical parameter | Role | Canonical unit/value | Common aliases |
|---|---|---|---|
| gravity_regime | input/context | microgravity, lunar, Martian, Earth, variable | micro-g, zero-g, low-g, partial-g |
| gravity_level | input | fraction of Earth g | g-level, acceleration level |
| gravitational_acceleration | input | m/s^2 | acceleration, effective gravity |
| gravity_vector | input | 3-element vector | acceleration vector |
| gravity_direction_relative_to_sample | input | category/vector | sample-gravity orientation |
| reduced_gravity_duration | context | s | low-g time, micro-g duration |
| residual_acceleration | context | fraction of Earth g | residual-g, g-jitter |
| vibration_level | context | acceleration spectrum | platform vibration |
| rotation_rate | context | rad/s | centrifuge speed, angular velocity |
| gravity_gradient | context | 1/s^2 or descriptive | centrifuge gradient |

Do not collapse microgravity, lunar gravity, Martian gravity, and reduced-pressure Earth tests into one `space` category.

---

## 7. G04 - Atmosphere and ambient conditions

| Canonical parameter | Role | Preferred unit | Common aliases |
|---|---|---|---|
| total_pressure | input | kPa | ambient pressure, cabin pressure, chamber pressure |
| oxygen_mole_fraction | input | fraction | O2%, oxygen level, XO2 |
| oxygen_partial_pressure | derived/input | kPa | pO2, oxygen pressure |
| nitrogen_mole_fraction | input | fraction | N2 fraction |
| carbon_dioxide_mole_fraction | input | fraction | initial CO2, background CO2 |
| suppressant_mole_fraction | input | fraction | diluent fraction, agent percentage |
| suppressant_species | input | category | CO2, He, N2, SF6, other |
| gas_composition | input | structured mixture | atmosphere, oxidizer composition |
| ambient_temperature | input | K | cabin temperature, initial gas temperature |
| relative_humidity | input | % | RH, humidity |
| gas_density | input/derived | kg/m^3 | ambient density |
| initial_oxygen_concentration | input | mol/m^3 | initial O2 concentration |
| initial_contaminant_level | input | ppm or mg/m^3 | background gas level |

Important distinction: oxygen mole fraction and oxygen partial pressure are related but not interchangeable. Retain both when pressure varies.

---

## 8. G05 - Flow, ventilation, and confinement

| Canonical parameter | Role | Preferred unit/value | Common aliases |
|---|---|---|---|
| flow_condition | input | quiescent, forced, mixed | still air, ventilation state |
| flow_velocity | input | cm/s | airspeed, forced flow, ventilation velocity |
| flow_direction | input | vector/category | airflow direction |
| flow_configuration | input | concurrent, opposed, cross-flow | downstream/upstream configuration |
| volumetric_flow_rate | input | L/min | airflow rate, fan flow |
| mass_flow_rate | input | g/s | oxidizer flow, gas feed rate |
| turbulence_intensity | input/context | % | turbulence level |
| reynolds_number | derived | dimensionless | Re |
| residence_time | derived | s | reactant residence time |
| damkohler_number | derived | dimensionless | Da |
| fan_state | input | on, off, speed level | blower state |
| duct_cross_section | context | m^2 | tunnel area, flow area |
| chamber_volume | context | m^3 | enclosure volume |
| hydraulic_diameter | derived/context | m | duct characteristic length |
| wall_distance | context | mm | distance to boundary |
| confinement_ratio | derived | dimensionless | blockage or confinement ratio |
| inlet_location | context | coordinates | vent inlet position |
| outlet_location | context | coordinates | vent outlet position |

Flow velocity, volumetric flow, and mass flow are different measurements. Convert only when geometry and thermodynamic conditions are available.

---

## 9. G06 - Material and fuel properties

| Canonical parameter | Role | Preferred value/unit | Common aliases |
|---|---|---|---|
| material_name | input | controlled name | sample, fuel, specimen material |
| material_trade_name | input | text | commercial product name |
| material_class | input | polymer, fabric, foam, wire, liquid, gas | fuel class |
| chemical_family | input | PMMA, cellulose, hydrocarbon, alcohol | chemistry group |
| material_composition | input | structured mixture | constituents, blend |
| substrate_material | input | controlled name | backing, support |
| coating_material | input | controlled name | surface treatment |
| material_density | input | kg/m^3 | bulk density |
| porosity | input | fraction | void fraction |
| moisture_content | input | mass fraction | water content |
| thermal_conductivity | input | W/(m K) | conductivity |
| specific_heat_capacity | input | J/(kg K) | heat capacity |
| emissivity | input | fraction | surface emissivity |
| heat_of_combustion | input | MJ/kg | effective heat of combustion |
| pyrolysis_temperature | input/model | K | decomposition temperature |
| ignition_temperature | input/model | K | critical surface temperature |
| material_condition | input | new, aged, contaminated, damaged | specimen condition |
| melting_behavior | output/category | none, softening, melting, dripping | melt response |
| char_behavior | output/category | none, thin, thick, expanding | charring/intumescence |
| spacecraft_relevance | context | flight material, analog, idealized | application realism |

`material_name`, `material_class`, and `chemical_family` must remain separate so users can search at different levels of specificity.

---

## 10. G07 - Specimen geometry and configuration

| Canonical parameter | Role | Preferred unit/value | Common aliases |
|---|---|---|---|
| sample_shape | input | sheet, slab, rod, wire, droplet, sphere | geometry, specimen form |
| sample_length | input | mm | length |
| sample_width | input | mm | width |
| sample_thickness | input | mm | depth, gauge, film thickness |
| sample_diameter | input | mm | rod/wire/droplet diameter |
| initial_droplet_diameter | input | mm | droplet size, D0 |
| sample_mass | input | g | initial mass |
| exposed_area | input/derived | cm^2 | burnable area |
| sample_orientation | input | vector/category | orientation |
| orientation_to_flow | input | degrees/category | alignment with airflow |
| orientation_to_gravity | input | degrees/category | upward/downward geometry |
| sample_arrangement | input | continuous, discrete, layered, bundled | fuel layout |
| sample_spacing | input | mm | gap, separation |
| sample_count | input | integer | number of droplets/specimens |
| mounting_method | context | clamped, frame, free, supported | holder configuration |
| edge_condition | context | exposed, framed, sealed | boundary condition |
| adjacent_material | context | controlled name | propagation neighbor |
| distance_to_wall | context | mm | enclosure clearance |

Terms such as `upward` and `downward` are defined relative to gravity. Terms such as `concurrent` and `opposed` are defined relative to forced flow. Do not use them as synonyms.

---

## 11. G08 - Ignition and external exposure

| Canonical parameter | Role | Preferred unit/value | Common aliases |
|---|---|---|---|
| igniter_type | input | hot wire, spark, radiant, hot surface | ignition source |
| ignition_mode | input | piloted, spontaneous, electrical | ignition method |
| ignition_location | input | edge, center, upstream, downstream | igniter position |
| ignition_energy | input | J | spark/ignition energy |
| igniter_power | input | W | heater power |
| ignition_duration | input | s | heating time, exposure time |
| igniter_temperature | input | K | heater temperature |
| external_heat_flux | input | kW/m^2 | radiant flux, imposed flux |
| ignition_area | input | mm^2 | heated/contact area |
| ignition_success | output | true/false/partial | ignition outcome |
| ignition_delay | output | s | time to ignition |
| smolder_to_flame_transition | output | true/false/time | transition event |
| reignition_event | output | true/false | recurrence after extinction |
| reignition_delay | output | s | time to recurrence |

Do not mix controlled exposure time with measured ignition delay.

---

## 12. G09 - Flame propagation and burning behavior

| Canonical parameter | Role | Preferred unit/value | Common aliases |
|---|---|---|---|
| flame_presence | output | boolean/time series | flame detected |
| flame_front_position | output | mm or coordinates | leading edge position |
| flame_trailing_edge_position | output | mm or coordinates | trailing edge position |
| flame_centroid | output | coordinates | flame center |
| flame_length | output | mm | luminous length |
| flame_width | output | mm | luminous width |
| projected_flame_area | output | mm^2 | image flame area, luminous area |
| estimated_flame_volume | derived | mm^3 | reconstructed volume |
| flame_standoff_distance | output | mm | distance from fuel surface |
| flame_spread_direction | output | vector/category | propagation direction |
| flame_spread_rate | output | mm/s | spread velocity, propagation speed |
| flame_growth_rate | output | area/time or length/time | growth rate |
| burning_duration | output | s | flame lifetime |
| burning_rate | ambiguous | must be specialized | do not use without definition |
| mass_loss_rate | output | g/s | fuel consumption rate |
| regression_rate | output | mm/s | surface/droplet regression |
| droplet_d_squared_slope | output | mm^2/s | droplet burning constant |
| flame_luminosity | output | calibrated intensity | brightness |
| flame_color_metric | output | calibrated color index | color ratio |
| flame_stability | output | steady, oscillating, intermittent | stability class |
| oscillation_frequency | output | Hz | pulsation frequency |
| local_extinction_event | output | time/location | partial flame loss |
| extinction_event | output | true/false/time | flameout, quenching |
| extinction_time | output | s | time to extinction |
| extinction_mechanism | derived/reported | quenching, blowoff, burnout, suppression | cause |
| limiting_oxygen_condition | output | fraction and pressure | LOI, MOC, extinction oxygen |
| low_velocity_quenching_limit | output | cm/s | radiative/quenching boundary |
| high_velocity_blowoff_limit | output | cm/s | blowoff boundary |
| residual_glowing | output | boolean/duration | glowing after flame |
| cool_flame_event | output | boolean/time range | low-temperature combustion |

Never store an unspecialized `burn_rate`. Determine whether the source means flame spread, mass loss, surface regression, or droplet diameter change.

---

## 13. G10 - Thermal and energy behavior

| Canonical parameter | Role | Preferred unit | Notes |
|---|---|---|---|
| flame_temperature | output | K | Include location and sensor |
| gas_temperature | output | K | Include coordinates |
| surface_temperature | output | K | Fuel surface temperature |
| plume_temperature | output | K | Downstream combustion products |
| wall_temperature | output | K | Enclosure response |
| heat_release_rate | output/derived | kW | HRR; state calculation method |
| peak_heat_release_rate | derived | kW | Maximum HRR |
| total_heat_release | derived | kJ | Time-integrated HRR |
| radiative_heat_flux | output | kW/m^2 | Radiometer measurement |
| convective_heat_flux | derived/output | kW/m^2 | Convective transfer |
| total_heat_flux | output | kW/m^2 | Combined heat flux |
| radiative_fraction | derived | fraction | Radiation/total energy |
| pyrolysis_rate | output/model | g/s | Fuel-generation rate |
| thermal_damage_area | output | cm^2 | Heat-affected region |
| burnout_time | output | s | Fuel consumption endpoint |

Every temperature and heat-flux value should link to sensor position, calibration, and timestamp.

---

## 14. G11 - Smoke, aerosol, and gas products

| Canonical parameter | Role | Preferred unit/value | Common aliases |
|---|---|---|---|
| smoke_generation_rate | output | g/s or calibrated proxy | smoke production |
| soot_yield | output | g soot/g fuel | soot production factor |
| soot_volume_fraction | output | fraction | soot concentration |
| aerosol_number_concentration | output | particles/cm^3 | particle count |
| aerosol_mass_concentration | output | mg/m^3 | particle mass |
| particle_size_distribution | output | distribution | size spectrum |
| particle_mean_diameter | derived | nm or um | state averaging method |
| particle_median_diameter | derived | nm or um | state number/mass basis |
| particle_morphology | output/category | sphere, aggregate, chain, droplet | particle form |
| optical_density | output | 1/m or dimensionless | smoke opacity |
| light_obscuration | output | %/m | visibility impact |
| visibility_distance | derived | m | visibility estimate |
| smoke_transport_velocity | output | cm/s | aerosol motion |
| smoke_arrival_time | output | s | time at detector/location |
| smoke_deposition | output | mg/m^2 | surface/filter deposition |
| oxygen_consumption | output | mol or rate | decrease in O2 |
| carbon_dioxide_concentration | output | ppm/fraction | CO2 product |
| carbon_monoxide_concentration | output | ppm | CO hazard |
| hydrogen_cyanide_concentration | output | ppm | HCN hazard |
| hydrogen_chloride_concentration | output | ppm | HCl hazard |
| hydrogen_fluoride_concentration | output | ppm | HF hazard |
| formaldehyde_concentration | output | ppm | cool-flame/toxicity product |
| post_fire_persistence_time | derived | s/min | cleanup burden |

Always preserve concentration basis: mole fraction, mass concentration, or instrument signal.

---

## 15. G12 - Detection and alarm performance

| Canonical parameter | Role | Preferred unit/value | Notes |
|---|---|---|---|
| detector_id | context | identifier | Links observations to device |
| detector_type | input/context | photoelectric, ionization, gas, thermal | Detection principle |
| detector_model | context | text | Manufacturer/model when public |
| detector_location | context | coordinates/category | Duct, chamber, wall |
| detector_orientation | context | vector/category | Relative to flow |
| detector_threshold | input | device-specific/calibrated | Alarm setting |
| detector_response_signal | output | time series | Raw detector output |
| detection_time | output | s | Time from ignition to alarm |
| detector_particle_range | context | nm or um | Sensitive size range |
| detector_gas_sensitivity | context | species/range | Gas detection coverage |
| false_positive_rate | output/validation | fraction | Reliability metric |
| false_negative_rate | output/validation | fraction | Missed-detection metric |
| monitored_volume | derived/context | m^3 | Effective coverage |
| ventilation_dependency | derived/reported | low, medium, high | Transport dependency |

Keep smoke production and detector performance separate. A smoke-rich fire may still evade a detector if transport or particle response is unfavorable.

---

## 16. G13 - Suppression, extinction, and recovery

| Canonical parameter | Role | Preferred unit/value | Common aliases |
|---|---|---|---|
| suppressant_species | input | CO2, N2, He, SF6, water mist | suppression agent |
| suppressant_concentration | input | fraction | agent percentage |
| suppressant_mass | input | g | delivered mass |
| suppressant_volume | input | L | delivered volume |
| suppressant_flow_rate | input | g/s or L/min | discharge rate |
| discharge_duration | input | s | agent delivery time |
| discharge_direction | input | vector/category | nozzle direction |
| nozzle_distance | input | mm | distance to fire |
| mist_droplet_size | input | um | water-mist size |
| activation_mode | input | manual, automatic | trigger mode |
| activation_delay | input/output | s | ignition-to-discharge delay |
| flame_reduction_fraction | output | fraction | suppression effectiveness |
| spread_arrest_time | output | s | time to stop propagation |
| extinguishment_time | output | s | agent activation to extinction |
| extinguishment_success | output | boolean/partial | outcome |
| reignition_after_suppression | output | boolean/time | recurrence |
| residual_hotspot_temperature | output | K | hidden re-ignition risk |
| agent_toxicity_constraint | context | category | crew compatibility |
| equipment_compatibility | context | category | corrosion/electronics impact |
| filtration_load | derived | mass/time | cleanup burden |
| habitat_recovery_time | derived | duration | return-to-use estimate |

---

## 17. G14 - Instrumentation and synchronization

| Canonical parameter | Type | Examples |
|---|---|---|
| instrument_id | identifier | camera, thermocouple, radiometer, gas sensor |
| instrument_type | category | visible camera, IR camera, anemometer |
| instrument_location | coordinates | x/y/z or named position |
| sampling_frequency | Hz | sensor sampling rate |
| timestamp_reference | category | GMT, mission elapsed time, local clock |
| synchronization_offset | s | offset from experiment master clock |
| calibration_date | date | latest calibration |
| calibration_method | text/category | calibration procedure |
| measurement_range | structured | minimum and maximum |
| instrument_resolution | unit-specific | smallest resolvable value |
| sensor_response_time | s | dynamic response |
| camera_resolution | pixels | width x height |
| camera_frame_rate | frames/s | FPS |
| camera_exposure | s | shutter/exposure time |
| camera_gain | device-specific | sensor gain |
| camera_viewpoint | category/pose | side, front, oblique |
| camera_spectral_band | nm range | visible/IR/filter band |
| pixel_scale | mm/pixel | spatial calibration |
| lens_distortion_model | structured | calibration coefficients |
| region_of_interest | pixels | ROI bounds |
| compression_method | category | codec or image format |
| missing_frame_count | integer | video completeness |

Image-derived measurements are comparable only after checking viewpoint, calibration, spectral response, exposure, and compression.

---

## 18. G15 - Data quality, uncertainty, and comparability

| Canonical parameter | Type | Meaning |
|---|---|---|
| measurement_uncertainty | numeric | Instrument and measurement uncertainty |
| uncertainty_type | category | standard, expanded, estimated, unknown |
| calibration_status | category | valid, expired, unknown, not applicable |
| missing_data_fraction | fraction | Proportion of expected data missing |
| data_gap_intervals | list | Missing time intervals |
| replicate_count | integer | Repeated tests under equivalent conditions |
| extraction_method | category | reported, manual, algorithmic, AI-assisted |
| extraction_confidence | fraction | Confidence in extracted value |
| source_quality | ordinal | raw, calibrated, peer-reviewed, summary |
| processing_history | list | Ordered transformations |
| comparison_normalization | list | Unit/image/time normalization applied |
| comparability_level | category | direct, normalized, partial, contextual, unsuitable |
| condition_match_score | fraction | Similarity of experimental conditions |
| domain_shift_score | fraction | Difference between evidence and target scenario |
| extrapolation_distance | numeric/vector | Distance outside observed parameter space |
| out_of_distribution_flag | boolean | Target outside supported domain |
| conflicting_evidence_flag | boolean | Material disagreement among sources |
| evidence_count | integer | Supporting tests/records |
| evidence_independence | ordinal | Repeated files versus independent experiments |
| model_validation_status | category | unvalidated, partial, validated in domain |

### 18.1 Comparability labels

| Label | Meaning |
|---|---|
| Directly comparable | Same physical definition, compatible apparatus, units, and measurement method |
| Comparable after normalization | Differences can be corrected through documented calibration or conversion |
| Partially comparable | Some important conditions differ; comparison is qualitative or conditional |
| Contextual evidence only | Relevant background, but not suitable for numerical comparison |
| Not comparable | Definitions, instruments, or physical regimes are incompatible |

### 18.2 Required comparison checks

Before ranking two tests as similar, check:

- Material identity and fuel form
- Sample geometry and scale
- Gravity regime and duration
- Total pressure and oxygen partial pressure
- Flow velocity and direction
- Ignition mode and external heating
- Confinement and wall effects
- Instrument definition and calibration
- Outcome definition
- Time reference and processing history

---

## 19. G16 - Derived safety intelligence

These parameters are produced by the application. They must never be labeled as direct NASA measurements.

| Derived dimension | Primary supporting groups | Recommended display |
|---|---|---|
| ignition_susceptibility | G04, G06, G07, G08 | evidence range plus confidence |
| propagation_hazard | G05, G06, G07, G09 | separate spread and growth indicators |
| thermal_hazard | G09, G10 | heat/temperature evidence |
| smoke_hazard | G05, G11 | production plus transport |
| toxicity_hazard | G11 | species-specific concentrations |
| detectability | G05, G11, G12 | detection time and coverage |
| suppressibility | G04, G09, G13 | extinction and agent evidence |
| reignition_hazard | G08, G09, G13 | residual combustion evidence |
| mission_consequence | G02 | consequence and response constraints |
| evidence_confidence | G01, G14, G15 | transparent quality score |
| research_gap_severity | all groups | missing parameter combinations |

Use a multidimensional safety profile rather than a single opaque risk score.

### 19.1 Known, inferred, unknown classification

| Class | Definition |
|---|---|
| Known | Directly measured or explicitly reported for matching conditions |
| Inferred | Estimated from related evidence with similarity and uncertainty shown |
| Unknown | Insufficient or unsuitable evidence |

---

## 20. Alias and synonym map

| Raw or historical terms | Canonical parameter | Normalization warning |
|---|---|---|
| O2%, oxygen level, oxygen concentration, XO2 | oxygen_mole_fraction | Confirm percent versus fraction |
| pO2, oxygen pressure | oxygen_partial_pressure | Do not substitute mole fraction alone |
| cabin pressure, ambient pressure, chamber pressure | total_pressure | Confirm absolute versus gauge pressure |
| airspeed, forced flow, ventilation velocity | flow_velocity | Confirm local versus nominal flow |
| airflow rate, fan flow | volumetric_flow_rate | Requires duct area to derive velocity |
| flame velocity, propagation speed, spread velocity | flame_spread_rate | Confirm direction and definition |
| burn rate | ambiguous | Split into spread, regression, mass-loss, or d-squared rate |
| sample depth, gauge, film depth | sample_thickness | Confirm geometry |
| micro-g, zero-g, low-g | gravity_regime | Also store numerical gravity level |
| flameout, quenched, extinguished | extinction_event | Preserve mechanism separately |
| LOI, MOC, extinction oxygen, O2 limit | limiting_oxygen_condition | Preserve test method and pressure |
| luminous area, segmented flame, flame image area | projected_flame_area | Preserve threshold and camera settings |
| smoke density, opacity | optical_density | Confirm measurement basis |
| detector alarm delay, response time | detection_time | Define reference event |
| suppressant percentage, diluent level | suppressant_concentration | Confirm mole, mass, or volume basis |

---

## 21. Canonical unit policy

| Quantity | Preferred unit | Preserve original? |
|---|---|---|
| Length | mm | Yes |
| Area | mm^2 or cm^2 | Yes |
| Volume | cm^3 or m^3 depending scale | Yes |
| Time | s | Yes |
| Velocity | cm/s for low-speed flame tests | Yes |
| Mass | g | Yes |
| Mass rate | g/s | Yes |
| Temperature | K | Yes |
| Pressure | kPa absolute | Yes |
| Gas fraction | mole fraction from 0 to 1 | Yes |
| Heat flux | kW/m^2 | Yes |
| Heat release rate | kW | Yes |
| Particle diameter | nm or um | Yes |
| Gas concentration | ppm or mole fraction | Yes |
| Acceleration | fraction of Earth g and m/s^2 | Yes |

Conversions must store the conversion method and never discard the source representation.

---

## 22. Dataset-family coverage map

The current local catalog contains 24 PSI investigations, including 19 flight investigations and five related ground/modeling studies. It lists 22 experimental test tables and roughly 3,000 test rows. The following map identifies the strongest dataset family for each question.

| Dataset family | PSI IDs in local catalog | Strong parameter groups | Best discovery question |
|---|---|---|---|
| FLEX / FLEX-2 | PSI-69, PSI-68 | G03-G05, G06-G08, G09-G11, G13-G15 | How do liquid droplets burn, extinguish, and respond to suppressants? |
| Cool Flame Investigation | PSI-39 plus PSI-117/142 studies | G04-G05, G06, G09-G11, G15 | When does visible extinction transition to cool-flame chemistry? |
| BASS / BASS-II | PSI-26, PSI-25 plus PSI-62 | G03-G10, G13-G15 | How do solid materials ignite, spread, and extinguish in low-speed flow? |
| SAFFIRE I-III | PSI-98, PSI-99, PSI-100 | G03-G05, G06-G11, G14-G15 | How do larger spacecraft-scale fires grow and affect the atmosphere? |
| SAME / SAME-R | PSI-102, PSI-101 plus PSI-115 | G05, G06, G11-G12, G14-G15 | Which smoke properties affect spacecraft detection? |
| DAFT / DAFT-2 | PSI-47 | G11-G12, G14-G15 | Can aerosol measurement hardware operate reliably in microgravity? |
| SPICE | PSI-107 plus PSI-60 | G04-G06, G09-G11, G14-G15 | When do gaseous flames begin producing soot? |
| SLICE | PSI-106 | G04-G05, G09-G10, G14 | How do flame structure and liftoff depend on flow? |
| ACME BRE | PSI-20 | G04-G10, G14-G15 | Can gaseous burning emulate material burning-rate and extinction behavior? |
| ACME CLD | PSI-21 | G04-G05, G09-G11, G14 | How do coflow diffusion flames form soot and radiation? |
| ACME E-FIELD | PSI-22 | G04-G05, G09-G10, G14 | How do electric fields change laminar diffusion flames? |
| ACME s-Flame | PSI-23 | G04-G05, G09-G10, G14 | How do spherical diffusion flames respond and extinguish? |
| ACME Flame Design | PSI-10 | G04-G06, G09-G11, G14 | How do flame configuration and fuel/oxidizer streams change soot? |
| ACME CFI-G | PSI-159 | G04-G06, G09-G11, G14 | What governs gaseous cool-flame behavior? |

### 22.1 Dataset selection by task

| User task | Start with | Then add |
|---|---|---|
| Solid-material flame spread | BASS-II, BASS | SAFFIRE, SoFIE publications, ground comparison |
| Large-fire growth | SAFFIRE I-III | BASS-II, modeling reports |
| Liquid-fuel extinction | FLEX, FLEX-2 | CFI and ground studies |
| Suppression effectiveness | FLEX | BASS suppression tests and reports |
| Smoke detection | SAME, SAME-R | DAFT, SAFFIRE gas/smoke measurements |
| Soot formation | SPICE, ACME CLD | Flame Design, SLICE |
| Mission scenario comparison | BASS-II plus SAFFIRE | NASA-STD-6001 context and published models |
| ML/video analysis | BASS-II and SAFFIRE video | FLEX image sequences after calibration review |

---

## 23. Search and filtering architecture

The dashboard should guide users from mission question to evidence rather than asking them to know NASA investigation names.

```text
Mission or application
  -> fire-safety question
      -> controlled conditions
          -> observed outcomes
              -> evidence quality
                  -> investigation and files
```

### 23.1 Recommended filters

1. Mission/destination
2. Question: ignition, spread, smoke, detection, suppression, extinction
3. Fuel state: solid, liquid, gas, aerosol/smoldering
4. Material class and specific material
5. Gravity regime
6. Pressure and oxygen partial pressure
7. Flow condition and velocity
8. Geometry and configuration
9. Measurement type
10. Data level
11. Comparability and confidence
12. Investigation and publication source

### 23.2 Example discovery query

```text
Question: solid-material flame spread
Gravity: microgravity
Flow: forced, 10-20 cm/s
Material class: fabric
Outputs: spread rate, flame area, oxygen change
Evidence: raw or calibrated, video available
```

The query engine should return BASS/BASS-II and relevant SAFFIRE tests first, but explain geometry and scale differences.

---

## 24. Minimum viable prototype schema

Start with the fields below before expanding to the full catalog.

| Section | Required fields |
|---|---|
| Identity | investigation_id, test_id, investigation_acronym, platform, source_doi, source_file, data_level |
| Gravity | gravity_regime, gravity_level, reduced_gravity_duration |
| Atmosphere | total_pressure, oxygen_mole_fraction, oxygen_partial_pressure, ambient_temperature |
| Flow | flow_condition, flow_velocity, flow_configuration, chamber_volume |
| Material | material_name, material_class, chemical_family, spacecraft_relevance |
| Geometry | sample_shape, sample_length, sample_width, sample_thickness or diameter, sample_orientation |
| Ignition | igniter_type, ignition_duration, ignition_location, ignition_success, ignition_delay |
| Flame | flame_spread_rate, projected_flame_area, flame_length, burning_duration, extinction_time |
| Smoke/gas | smoke indicator, oxygen change, carbon_dioxide concentration, carbon_monoxide when available |
| Suppression | suppressant_species, suppressant_concentration, extinguishment_success, reignition |
| Evidence | instrument_id, extraction_method, uncertainty, comparability_level, domain_shift_score |

### 24.1 Prototype priority tiers

| Tier | Include | Reason |
|---|---|---|
| Tier 1 | identity, material, pressure/O2, airflow, geometry, spread/extinction, source | Necessary for credible comparison |
| Tier 2 | synchronized video, temperature, gas measurements, suppression | Creates useful multimodal evidence |
| Tier 3 | toxicity, detailed material properties, mission consequence, modeling | Valuable but dependent on sparse metadata |

---

## 25. Recommended database structure

Use related tables rather than one extremely wide spreadsheet.

| Table | Primary key | Contents |
|---|---|---|
| investigations | investigation_id | PSI-level metadata and provenance |
| experiments | experiment_id | Apparatus/configuration-level metadata |
| tests | test_id | Controlled inputs and specimen configuration |
| observations | observation_id | Long-format measured values |
| time_series | series_id | Sensor arrays and synchronized timestamps |
| media_assets | asset_id | Video/image metadata and calibration |
| instruments | instrument_id | Sensor definitions and locations |
| publications | publication_id | NTRS/DOI references |
| mission_scenarios | scenario_id | User-defined target conditions |
| evidence_links | link_id | Test-to-scenario similarity and domain shift |
| parameter_dictionary | parameter_id | Canonical names, aliases, types, units |

### 25.1 Long-format observation model

Prefer:

```text
test_id | time | parameter | value | unit | instrument_id | uncertainty
```

over a different wide-table schema for every investigation. Wide source tables may be retained in a raw staging layer.

---

## 26. Ranking and comparison logic

### 26.1 Evidence relevance

Rank evidence using visible components rather than an opaque AI score:

| Component | Example comparison |
|---|---|
| Material similarity | same material > same chemical family > same broad class |
| Geometry similarity | same shape/thickness > scaled analog > different form |
| Gravity similarity | same gravity regime > validated correlation > extrapolation |
| Atmosphere similarity | distance in pressure and oxygen partial pressure |
| Flow similarity | velocity and concurrent/opposed configuration |
| Ignition similarity | same source, location, duration, and heat flux |
| Scale similarity | specimen and enclosure dimensions |
| Measurement quality | calibrated direct measurement > derived estimate > narrative report |

### 26.2 Evidence confidence

Confidence should combine, but not hide:

- Source quality
- Calibration status
- Replicate count
- Missingness
- Measurement uncertainty
- Agreement among independent experiments
- Distance from the target scenario
- Validation status of any model used

### 26.3 Do not produce unsupported predictions

If a scenario lies outside the observed range of gravity, oxygen, pressure, material, flow, or geometry, mark it as `unknown` or `out_of_distribution`. A research-gap result is more valuable than a falsely precise prediction.

---

## 27. Data ingestion workflow

```text
1. Register investigation and source files
2. Preserve raw tables and media unchanged
3. Profile raw column names, units, missingness, and types
4. Map raw names to canonical parameters
5. Validate unit conversions
6. Separate controlled inputs from measured outputs
7. Attach instruments, calibration, timestamps, and uncertainty
8. Compute only documented derived fields
9. Assign comparability metadata
10. Publish searchable evidence records with source links
```

### 27.1 Mapping status values

| Status | Meaning |
|---|---|
| mapped_exact | Raw field is scientifically equivalent to canonical field |
| mapped_with_conversion | Equivalent after unit or representation conversion |
| mapped_conditional | Meaning depends on investigation documentation |
| unresolved | Requires subject-matter review |
| rejected | Field is not equivalent or is unusable |

---

## 28. Validation checklist

Before a normalized dataset enters the prototype, confirm:

- Each test has a stable test identifier.
- Original filenames, column names, values, and units remain available.
- Pressure is absolute or explicitly marked otherwise.
- Gas percentage basis is known.
- Oxygen partial pressure is calculated only when appropriate.
- Airflow value specifies local/nominal and velocity/volume/mass basis.
- Material and geometry are separated.
- Ignition inputs and ignition outcomes are separated.
- `burn rate` has been disambiguated.
- Image-derived metrics include camera and threshold information.
- Time-series clocks are synchronized or their offsets are known.
- Missing values are not converted to zeros.
- Derived values identify their formula or model.
- Comparability labels have reasons.
- Every dashboard insight links back to source evidence.

---

## 29. Research gaps captured by the schema

The ontology should make these gaps visible rather than silently filling them:

- Sparse partial-gravity data for lunar and Martian conditions
- Limited realistic spacecraft materials compared with PMMA and cellulose
- Limited cross-experiment imaging calibration
- Missing low-speed in-situ flow measurements
- Scale differences between small test chambers and realistic habitats
- Under-studied smoke, toxicity, and post-fire cleanup
- Limited suppression and reignition evidence for practical configurations
- Incomplete historical coverage, particularly older experiments
- Uncertain transfer from Earth flammability tests to reduced gravity
- Sparse independent replicates for some parameter combinations

---

## 30. Research sources and local inputs

### Local catalog used

- `flame_in_freefall_data_catalog.xlsx` - 24 PSI investigations, experimental-table links, file manifest, and NTRS references.
- `flame_in_freefall_data/experimental_tables.csv` - links to 22 PSI experimental tables.
- `flame_in_freefall_data/investigations.csv` - investigation objectives, platforms, DOI links, and dataset sizes.
- `flame_in_freefall_data/psi_files_manifest.csv` - analyzed data and documentation manifest.
- `flame_in_freefall_data/ntrs_reports.csv` - selected NASA Technical Reports Server references.

### Authoritative external references

1. NASA Physical Sciences Informatics repository: https://psi.nasa.gov/physci/repo
2. NASA PSI investigations by research area: https://www.nasa.gov/physical-sciences-informatics-psi/psi-investigations-by-research-area/
3. NASA combustion and fire-safety overview: https://www.nasa.gov/missions/station/iss-research/studying-combustion-and-fire-safety/
4. NASA-STD-6001, Flammability, Offgassing, and Compatibility Requirements and Test Procedures: https://standards.nasa.gov/standard/NASA/NASA-STD-6001
5. NASA Technical Reports Server: https://ntrs.nasa.gov/
6. Challenges and Research Needs for Micro- and Partial-Gravity Fires: https://smd-cms.nasa.gov/wp-content/uploads/2023/05/60_afb22b1e538432728848e83bb3ade8c2_LiaoYaTingT.pdf
7. NIST Fire Dynamics Simulator and Smokeview: https://pages.nist.gov/fds/

---

## 31. Maintenance guidance

When a new dataset is added:

1. Add any new raw aliases to the synonym map.
2. Reuse existing canonical parameters whenever the physical meaning matches.
3. Add a new canonical parameter only when the scientific meaning is genuinely different.
4. Define type, role, preferred unit, valid range, and provenance requirements.
5. Record which investigation introduced the new parameter.
6. Update the dataset-family coverage map.
7. Regenerate the PDF and review the rendered pages.

The Markdown file is the editable source of truth. The PDF is a generated publication artifact.

