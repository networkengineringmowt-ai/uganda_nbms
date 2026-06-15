# Data and Engineering Methods

## 1. Core Asset Records

### Bridge identity

The stable bridge key is `BridgeNumber`.

Common top-level fields include:

- `BridgeNumber`
- `BridgeName`
- `RoadDescrPrincipal`
- `LinkID`
- `Region`
- `Station`
- `District`
- `Lat` / `Lon` or equivalent coordinate fields
- `OverallCondition`
- `OverallConditionRating`
- `Traffic`
- `LegacyData`

`LegacyData` retains detailed fields imported from historical BMS sources, including component ratings, dimensions, structural descriptions, administrative fields, and source metadata.

### Culvert identity

The stable major-culvert key is `CulvertNumber`.

Common fields include:

- `CulvertNumber`
- `River`
- `Road`
- `Link_Name`
- `Maintenance_Station`
- Coordinates
- Cell type and number of barrels
- Span/opening width
- Scour-protection fields
- `LegacyData`

## 2. Data Sources

| File | Purpose |
| --- | --- |
| `public/data/bridges.json` | Full bridge inventory and attached legacy/traffic data |
| `public/data/culverts.json` | Major-culvert inventory |
| `public/data/critical_structures.json` | Engineering intervention shortlist |
| `public/data/analytics.json` | Precomputed network summaries |
| `public/data/bridge_works.json` | Active intervention and works records |
| `public/data/road_network.json` | Road-network register |
| `public/data/historical_traffic.json` | Historical traffic observations |
| `public/data/documents.json` | Document index |
| `public/gallery/index.json` | Structure-to-photo index |

## 3. Condition Scale

The application uses a 0-9 overall condition scale:

| Rating | Category |
| ---: | --- |
| 9 | Excellent |
| 8 | Very Good |
| 7 | Good |
| 6 | Satisfactory |
| 5 | Fair |
| 4 | Marginal |
| 3 | Poor |
| 2 | Very Poor |
| 1 | Critical |
| 0 | Beyond Repair |

Zero is a valid severe-condition rating and must never be used to mean unknown or missing.

The code dictionaries for bridge, deck, material, abutment, pier, parapet, wearing-surface, bearing, crossing, and culvert types are in `src/utils/dataDictionary.js`.

## 4. Active Bridge Overall-Rating Method

The bridge inspection form uses `src/utils/rankingEngine.js`.

For each available core component:

```text
Overall rating = round(sum(component rating x condition-dependent weight)
                       / sum(condition-dependent weight))
```

Core components:

- Approaches
- Substructure
- Superstructure
- Roadway
- Waterway, when provided

The weight increases as a component's condition deteriorates so that serious defects have greater influence on the overall rating.

Example condition-dependent weights:

| Component | Ratings 0-2 | Ratings 3-4 | Ratings 5-9 |
| --- | ---: | ---: | ---: |
| Approaches | 6 | 2 | 0.25 |
| Waterway | 8 | 2 | 1 |
| Substructure | 8 | 4 | 2 |
| Superstructure | 8 | 4 | 2 |
| Roadway | 6 | 2 | 0.5 |

## 5. Condition Deficiency

The active inspection form calculates bridge condition deficiency using component condition coefficients, component weights, and a traffic factor.

Conceptually:

```text
DC = 100 x (ADTO / ADTB)^K4 x sum(Ki x Wi)
```

Where:

- `ADTO` is the traffic input passed to the calculation.
- `ADTB` is the base traffic constant.
- `K4` controls the traffic adjustment.
- `Ki` is the condition coefficient for a component and rating.
- `Wi` is the component weight.

The result is clamped to the range 0-100.

Important: the current inspection form passes a fixed traffic value to this calculation. It should be connected to the selected structure's validated AADT before the result is used for formal prioritisation.

## 6. Culvert Condition

The current culvert inspection form calculates a rounded arithmetic average of the available 0-9 component ratings, then maps the result into an overall category.

This is suitable for operational screening. A formally approved culvert weighting standard should replace it if the Ministry adopts one.

## 7. Asset Valuation

The reports workspace calculates indicative Current Replacement Cost and Current Depreciated Replacement Cost.

Current report method:

```text
Area = length x width
CRC = area x operator-supplied unit cost
CDRC = CRC x overall rating / 9
```

These are planning estimates. Validate dimensions, unit rates, structure complexity, inflation, and depreciation method before formal financial use.

`src/utils/bmsAlgorithms.js` also contains a placeholder valuation implementation using an estimated unit cost. Treat that implementation as reference logic until the cost basis is formally approved and externally configured.

## 8. Traffic Data

Bridge traffic information is stored under the `Traffic` object where available. Typical fields include:

- `aadt_2026`
- `growth_rate`
- `link_id`
- `link_name`
- Vehicle class shares
- Source-file references

Analytics group traffic into demand bands. Traffic estimates should be traceable to source counts, projection assumptions, and link matching.

## 9. Critical Structures and Maintenance

`critical_structures.json` contains the operational intervention shortlist. Typical fields include:

- Bridge number and name.
- Road link.
- Maintenance station.
- Overall rating.
- Dimensions.
- Engineering action comment.

The maintenance workspace searches and filters this list and links matching rows back to the full bridge record.

## 10. Data Quality Checks

Recommended validation before publishing an updated dataset:

1. Confirm unique `BridgeNumber` and `CulvertNumber` values.
2. Confirm valid JSON.
3. Confirm coordinates are numeric and within Uganda/network bounds.
4. Confirm road link and station fields use controlled names.
5. Confirm condition ratings are in range and distinguish missing from zero.
6. Confirm critical structures have comments and supporting evidence.
7. Confirm photo index entries point to existing files.
8. Regenerate spatial and analytics products.
9. Compare record counts against the previous release.
10. Run the application build and browser workflow checks.

## 11. Data Regeneration

The `data_engine` directory contains scripts used to produce analytics, spatial layers, critical-structure lists, legacy enrichment, documents, media indexes, and traffic history.

Run data-generation scripts only against a backed-up source dataset. Review their output diffs before release because generated files affect most public workspaces.
