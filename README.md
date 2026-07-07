# Uganda Bridge Management System

The Uganda Bridge Management System (BMS) is a React/Vite operational workspace for managing the national bridge and major-culvert inventory. It combines inventory capture, condition inspection, GIS mapping, maintenance prioritisation, traffic analytics, data validation, valuation reports, and administrative tools.

Live application: <https://priscananjehe1996.github.io/uganda_bms/>

## Current Dataset

The bundled public dataset contains:

| Dataset | Records |
| --- | ---: |
| Bridges | 546 |
| Major culverts | 452 |
| Road-network links | 1,023 |
| Critical structures | 69 |
| Historical traffic records | 691 |
| Documents | 51 |

The application can read from Supabase and falls back to the bundled JSON files in `public/data`.

## Main Workspaces

- **Overview:** national structure totals, condition distribution, regional coverage, and priority structures.
- **GIS Map:** bridge and culvert locations, road classes, waterways, structure search, detail records, and evidence photos.
- **Inventory:** bridge, culvert, road-network, and intervention registers.
- **Maintenance:** prioritised structures and active works.
- **Analytics:** interactive 3D condition, traffic, regional, and data-dictionary categorical analysis.
- **Reports:** validation audits, current replacement cost, depreciated replacement cost, and printable structure reports.
- **Photos:** structure-first chronological inspection evidence timelines with source lineage.
- **Digital Twin:** parametric 3D bridge and major-culvert models generated from inventory and condition fields.
- **Sources & Evidence:** admin documentation library, source-document register, evidence coverage, and operational data lineage.
- **Data Capture:** bridge and culvert inventory forms plus condition-inspection forms.
- **Administration:** upgrades, system parameters, architecture, and algorithm reference views.

## Access Profiles

The current static deployment presents three role profiles:

- `bms`: data-entry workspaces.
- `super`: dashboard, map, inventory, maintenance, analytics, and reports.
- `admin`: all dashboard, data-entry, and administration workspaces.

The current login is a client-side role gate for controlled demonstration and internal use. It is **not** a production authentication boundary. See [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md#security-boundary).

## Quick Start

Requirements:

- Node.js 20 or later
- npm

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite.

To run the frontend and the local Google Drive JSON writer together:

```bash
npm run dev:full
```

Useful commands:

```bash
npm run lint
npm run build
npm run build:pages
npm run preview
npm run deploy
npm run seed:supabase
```

## Data Modes

| Mode | Reads | Writes | Intended use |
| --- | --- | --- | --- |
| Static | `public/data/*.json` | None | Public fallback and reliable read-only browsing |
| Supabase | PostgreSQL JSONB through PostgREST | Only when an appropriate write policy exists | Shared hosted data |
| Local companion server | Google Drive-synchronised JSON files | Yes | Controlled local data-entry workstation |

Copy `.env.example` to `.env.local` to override development settings. Never commit service-role keys.

## Documentation

- [User Guide](docs/USER_GUIDE.md)
- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)
- [Data and Engineering Methods](docs/DATA_AND_ENGINEERING.md)
- [Operations and Deployment Runbook](docs/OPERATIONS_AND_DEPLOYMENT.md)
- [Photo Evidence and Digital Twin Guide](docs/PHOTO_EVIDENCE_AND_DIGITAL_TWIN.md)
- [Photogrammetry and Reality Twin](docs/PHOTOGRAMMETRY_REALITY_TWIN.md)
- [Open-Source Enterprise GIS Architecture](docs/ENTERPRISE_GIS_ARCHITECTURE.md)

## Important Limitations

- GitHub Pages is static and cannot securely perform privileged writes by itself.
- The displayed role gate must be replaced by real identity authentication before use as an internet-facing write-enabled system.
- System-parameter and upgrade additions currently update interface state only unless connected to a persistent backend.
- Public evidence photos are resolved from the repository's raw-content URL in production to keep the Pages artifact small.
