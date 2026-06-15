# Uganda BMS User Guide

## 1. Purpose

The Uganda BMS supports routine bridge and major-culvert management across the national road network. It gives engineering, planning, data-entry, and administrative users a shared view of asset identity, location, condition, traffic demand, maintenance needs, and supporting evidence.

The live application is available at:

<https://priscananjehe1996.github.io/uganda_bms/>

## 2. Access Profiles

The application opens at a role-access screen.

| Profile | Primary audience | Available workspaces |
| --- | --- | --- |
| Data Entry (`bms`) | Inventory and inspection staff | Bridge Data, Culvert Data, Inspect Bridge, Inspect Culvert |
| Dashboard User (`super`) | Engineers, planners, and managers | Overview, GIS Map, Inventory, Maintenance, Analytics, Reports |
| Admin (`admin`) | BMS administrators | All Dashboard User and Data Entry workspaces, plus Upgrades, Config, Architecture, Algorithms, and Sources & Evidence |

The current role screen is a client-side role gate. Do not treat it as a secure internet authentication system.

The primary horizontal navigation is organised by section. Select a main section to reveal only its related contextual tabs:

- **Network:** GIS Map and Inventory.
- **Operations:** Maintenance, Analytics, and Reports.
- **Evidence:** Photos and, for administrators, Sources & Evidence.
- **Data Capture:** inventory and inspection entry workspaces.
- **Administration:** BMS management and system tools.

### 2.1 Sources & Evidence

Administrators use **Sources & Evidence** to review the generated documentation library, search the indexed source-document corpus, check evidence-photo coverage, and inspect the published operational dataset register.

## 3. Dashboard User Workflows

### 3.1 Overview

Use **Overview** for a national operational summary.

The overview provides:

- Total registered bridges and major culverts.
- Structures identified for immediate attention.
- Condition-data coverage.
- Average estimated traffic demand.
- Overall bridge-condition distribution.
- Structure counts by maintenance region.
- A priority-engineering work queue.
- Shortcuts to map, inspection, maintenance, and inventory workspaces.

Select a structure in the priority queue to open it on the GIS map.

### 3.2 GIS Map

Use **GIS Map** to locate and review structures spatially.

The map contains:

- Bridge markers.
- Major-culvert markers.
- National-road links classified by road class.
- Waterway geometry.
- Esri imagery and place labels.
- A searchable structure list.
- A detail drawer for the selected structure.

To review a structure:

1. Search by structure number or name in the left list.
2. Select the structure.
3. Review location, road link, dimensions, condition, traffic, responsible station, and evidence photo in the detail drawer.
4. Close the drawer to return to a wider map view.

Map coordinates are read from the asset record and the spatial GeoJSON layers. Records with missing or invalid coordinates cannot be plotted.

### 3.3 Inventory

Use **Inventory** to browse the underlying operational registers.

Available registers include:

- Bridges Registry.
- Major Culverts.
- Road Network and NDP IV data.
- Ongoing Interventions.

Tables support scanning and sorting. Use the browser's page search only as a last resort; structure-specific searches are faster in the GIS and data-entry workspaces.

### 3.4 Maintenance

Use **Maintenance** to review intervention priorities.

The workspace shows:

- Number of priority structures.
- Condition summary.
- Active works record.
- Searchable and filterable intervention queue.
- Road link, maintenance station, condition, and engineering action note.

Use the arrow action on a queue row to open the matching bridge on the GIS map when a full bridge record is available.

### 3.5 Analytics

Use **Analytics** to understand network patterns.

Current views cover:

- Overall bridge condition.
- Traffic demand bands.
- Bridges by region.
- Major culverts by region.
- Maintenance-station distribution.
- Scour-risk profile.

Analytics are generated from `public/data/analytics.json`. Regenerate that dataset after major source-data changes.

### 3.6 Reports

Use **Reports** for data assurance and printable outputs.

#### Data Validation

Reviews:

- Unchecked records.
- Records missing core ratings.
- Structures without inspections.

#### Financial Valuation

Calculates indicative:

- Current Replacement Cost (CRC).
- Current Depreciated Replacement Cost (CDRC).

The report allows an operator-supplied unit cost. Values are planning estimates and require engineering and financial validation before formal use.

#### Structure Reports

Select a bridge to generate a printable inventory and rating report. Use the browser print dialog to print or save the report as PDF.

### 3.7 Photos

Use **Photos** to browse every indexed evidence image.

- Search by structure number, structure name, filename, or source path.
- Filter bridge, culvert, and unassigned photos.
- Switch between a visual grid and an evidence table.
- Select any preview to open the full image.
- Use **Load more photos** to progressively browse the complete library without loading all images at once.

Each GIS structure detail also shows every photo indexed to that structure.

## 4. Data Entry Workflows

### 4.1 Bridge Inventory

Use **Bridge Data** to create or update bridge baseline information.

1. Search for and select an existing bridge, or choose **New Bridge**.
2. Complete identification and routing fields.
3. Complete structural characteristics.
4. Complete dimensions and measurements.
5. Complete administrative information.
6. Review the data-completeness gauge.
7. Save the record.

`BridgeNumber` is the unique record identifier. It cannot be changed after an existing record is selected.

### 4.2 Culvert Inventory

Use **Culvert Data** to create or update a major-culvert record.

Capture:

- Culvert number.
- River or stream.
- Road and link.
- Maintenance station.
- Coordinates.
- Cell type and number of barrels.
- Opening width.
- Inlet and outlet scour protection.

`CulvertNumber` is the unique record identifier.

### 4.3 Bridge Inspection

Use **Inspect Bridge** to record component condition and defects.

1. Search for and select a bridge.
2. Rate the applicable components.
3. Add observed defects and quantities where applicable.
4. Review the calculated overall condition and deficiency result.
5. Save the inspection.

Core bridge components include approaches, waterway, substructure, superstructure, and roadway. Additional fields cover expansion joints, drainage, traffic barriers, guardrails, and cell/CMP structures.

The active bridge calculation uses the `rankingEngine.js` weighting method. Ratings must remain within the scale presented by the form.

### 4.4 Culvert Inspection

Use **Inspect Culvert** to rate:

- Barrel alignment.
- Seams and joints.
- Barrel material.
- Footings and scour.
- Approaches.
- Roadway deck.

The form calculates an average 0-9 rating and a condition category.

## 5. Admin Workflows

### 5.1 Upgrades

Use **Upgrades** to review active works and stage upgrade records. Newly added upgrade rows currently exist in the active browser session only; a persistence endpoint is still required for permanent storage.

### 5.2 Config

Use **Config** to review and adjust deficiency-index weights. The interface validates that the weights total `1.00`. Current changes are session-only and do not alter the active calculation engine until persistence and configuration loading are connected.

### 5.3 Architecture and Algorithms

These screens are reference views. The architecture view includes both implemented components and target capabilities. Consult the [Technical Architecture](TECHNICAL_ARCHITECTURE.md) for the authoritative implemented-state description.

## 6. Save Behavior

When a user saves bridge or culvert data:

1. The application attempts a Supabase upsert when `VITE_BMS_DATA_SOURCE` is not `static`.
2. If Supabase writing fails, it attempts the local companion API at `VITE_LOCAL_BMS_API`.
3. If neither write target accepts the update, the form displays an error.

The default public Supabase schema permits reads but intentionally denies anonymous writes. This protects the public dataset.

## 7. Data Quality Rules

- Use stable unique identifiers.
- Enter coordinates in decimal degrees.
- Confirm the road link and maintenance station.
- Record units consistently.
- Do not use a zero rating to represent missing data; zero means beyond repair.
- Confirm all critical ratings with inspection evidence and engineering review.
- Mark records as checked only after source-document and location validation.

## 8. Troubleshooting

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Data loads but saves fail | Public Supabase writes are disabled and local API is not running | Run `npm run dev:full` locally or configure a secured write backend |
| A structure is absent from the map | Missing or invalid coordinates | Review its latitude/longitude and spatial data |
| An evidence photo is absent | No indexed photo, missing raw file, or raw GitHub request failure | Check `public/gallery/index.json` and the referenced file |
| Analytics do not reflect a recent edit | Analytics JSON is precomputed | Regenerate analytics and rebuild |
| Public site shows an older release | GitHub Pages deployment is still running or cached | Check the deployment run and refresh after completion |
