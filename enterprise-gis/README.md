# Uganda BMS Enterprise GIS

This directory is a complete open-source enterprise GIS reference stack for the Uganda BMS. It includes PostGIS, GeoServer, pygeoapi, MapProxy, Keycloak, MinIO, pgAdmin, Prometheus, Grafana, Nginx, a custom catalog API, database schemas, imports, audit history, backups, restores, and direct repair tools.

## Start

```powershell
Copy-Item .env.example .env
# Replace every placeholder password.
.\scripts\manage.ps1 start
.\scripts\manage.ps1 import
.\scripts\manage.ps1 status
```

Open `http://localhost:8088/health`. See [Enterprise GIS Architecture](../docs/ENTERPRISE_GIS_ARCHITECTURE.md) for the complete design and operational controls.
