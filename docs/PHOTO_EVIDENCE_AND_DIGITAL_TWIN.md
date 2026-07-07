# Photo Evidence and Digital Twin Guide

## Purpose

This guide defines how the Uganda BMS links inspection photographs to bridge and major-culvert records, presents chronological evidence, and generates a parametric digital twin for each structure.

## Authoritative Photo Source

The evidence ingestion script searches the following locations in order:

1. `G:\My Drive\MOWT\Uganda National Road Network Repository\Bridge stuff\PHOTOS`
2. `G:\My Drive\MOWT\Uganda National Road Network Repository\PHOTOS`
3. `D:\OneDrive\Uganda National Road Network Repository\Bridge stuff\PHOTOS`

The first available directory becomes the authoritative source for lineage matching. The publishable static photo collection remains in `public/gallery/images`. GitHub Pages loads those publishable files from raw GitHub content while using `public/gallery/index.json` for structure placement and evidence metadata.

## Structure Assignment Rules

Each photo is assigned using this precedence:

1. **Source folder:** the nearest source-directory segment matching a valid bridge or culvert identifier, such as `B001` or `C150`.
2. **Filename:** a valid `B###` or `C###` token in the publishable filename.
3. **Unassigned:** no valid structure identifier is present in either source folders or the filename.

Only identifiers present in the bundled bridge and culvert registers are accepted. This prevents unrelated numeric image names from being interpreted as structures.

The generated `match_method` field records the result:

- `source-folder-and-filename`: source folder and filename agree.
- `source-folder`: the source folder provides the valid assignment.
- `filename`: the filename provides the valid assignment.
- `unassigned`: evidence requires manual review.

## Naming Convention

The most reliable structured filename pattern is:

```text
<structure_id>_<inspection_year>_<sequence>.<extension>
```

Examples:

```text
B001_08_01.JPG
B001_17_12.jpg.JPG
C150_23_04.JPG
```

Interpretation:

- `B001` or `C150`: structure identifier.
- `08`, `17`, or `23`: inspection year, interpreted as 2008, 2017, or 2023.
- `01`, `12`, or `04`: photo sequence within the inspection record.

Unstructured camera names such as `IMG_2137.JPG` and `DSCN9270.JPG` are assigned from their source folder when possible. Four-digit years embedded in dated folder names take precedence over two-digit filename year tokens.

## Duplicate Alias Handling

Historic imports created prefixed aliases such as:

```text
B001_B001_08_01.JPG
```

When multiple publishable filenames link to the same original source path, the index retains every filename for traceability and marks later aliases with `duplicate_of`. Evidence timelines hide those aliases so an engineer does not review the same photograph twice.

## Generated Photo Index

Run:

```bash
node scripts/ingestPhotos.mjs
```

The script scans the source repository, validates structure identifiers against `public/data/bridges.json` and `public/data/culverts.json`, and rebuilds `public/gallery/index.json`.

Each index record may include:

| Field | Meaning |
| --- | --- |
| `structure_id` | Valid linked bridge or culvert identifier |
| `filename` | Publishable gallery filename |
| `path` | Static gallery path |
| `original_path` | Full authoritative source path |
| `source_relative_path` | Source path relative to the photo repository |
| `capture_year` | Derived inspection year |
| `sequence` | Derived within-record photo sequence |
| `match_method` | Assignment evidence |
| `naming_status` | Structured, folder-assigned, or unstructured |
| `duplicate_of` | Canonical publishable filename for an alias |

## Evidence Timeline

The Evidence workspace is structure-first:

1. Search or filter the structure directory.
2. Select a bridge or culvert.
3. Select an inspection year from the year rail.
4. Move through that year's ordered evidence sequence.

The structure detail panel uses the same timeline component, so map review and the Evidence workspace show consistent records.

## Digital Twin

The Network > Digital Twin workspace generates a Three.js model for every loaded bridge and major culvert.

Bridge geometry derives from:

- `length` or `bridge_len`
- `width` or `bridge_wid`
- `no_of_spans` or `no_of_span`
- `type_bridge`
- `type_deck_material`
- component condition ratings

Culvert geometry derives from:

- pipe or cell count
- span or diameter
- overall dimensions
- structure, roadway, and waterway ratings

Colors communicate component condition:

- Green: good condition
- Amber: fair condition
- Orange/red: poor or critical condition
- Blue: unrated or unavailable

The twin is parametric and intended for inventory understanding and condition communication. It is not a survey-grade BIM model and must not be used to infer unrecorded dimensions.

## Map and Analytics Rules

- The GIS basemap is permanently set to Esri World Imagery with the Esri boundaries-and-places label overlay.
- Analytics charts use 3D rendering.
- Categorical analytics labels are decoded from the official BMS data dictionary, including structural type, deck form, material, crossing, abutment, pier, railing, and bearing categories.

## Release Verification

Before deployment:

```bash
node scripts/ingestPhotos.mjs
npm run lint
npm run build:pages
npm run deploy
```

Verify:

- the photo index count and assignment summary printed by the ingestion script;
- a structured filename, a folder-assigned camera filename, and an unassigned record;
- timeline transitions and image loading;
- digital-twin canvas rendering and orbit interaction;
- 3D categorical analytics;
- hybrid imagery and labels on the GIS map.
