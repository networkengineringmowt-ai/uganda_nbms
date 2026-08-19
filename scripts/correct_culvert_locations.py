"""Align major culverts with their attached national-road links.

The road-link geometry is the spatial authority. Existing coordinates are
snapped to the attached link and the culvert chainage is recalculated as
cumulative distance from the start of the road (the link's road-chainage start
plus distance along that link). Records without a link are assigned to their
nearest road link. If a coordinate is clearly malformed, the script
first attempts the common latitude/longitude swap; otherwise it locates the
culvert from its recorded chainage (or the link midpoint as a last resort).
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any


EARTH_RADIUS_M = 6_371_008.8
UGANDA_BOUNDS = (28.0, -5.0, 36.0, 6.0)
FAR_FROM_LINK_M = 2_000.0


def number(value: Any) -> float | None:
    try:
        if value in (None, ""):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def xy(value: list[float] | tuple[float, ...]) -> tuple[float, float]:
    return float(value[0]), float(value[1])


def valid_point(lon: Any, lat: Any) -> tuple[float, float] | None:
    lon_value, lat_value = number(lon), number(lat)
    if lon_value is None or lat_value is None:
        return None
    min_lon, min_lat, max_lon, max_lat = UGANDA_BOUNDS
    if min_lon <= lon_value <= max_lon and min_lat <= lat_value <= max_lat:
        return lon_value, lat_value
    return None


def haversine(a: tuple[float, float], b: tuple[float, float]) -> float:
    lon1, lat1 = map(math.radians, a)
    lon2, lat2 = map(math.radians, b)
    delta_lat, delta_lon = lat2 - lat1, lon2 - lon1
    value = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
    )
    return 2 * EARTH_RADIUS_M * math.asin(min(1.0, math.sqrt(value)))


def geometry_lines(geometry: dict[str, Any]) -> list[list[tuple[float, float]]]:
    coordinates = geometry["coordinates"]
    raw_lines = [coordinates] if geometry["type"] == "LineString" else coordinates
    return [[xy(point) for point in line] for line in raw_lines if len(line) >= 2]


def ordered_points(feature: dict[str, Any]) -> list[tuple[float, float]]:
    """Join multipart geometry and orient it from the link's official start."""
    points: list[tuple[float, float]] = []
    for raw_line in geometry_lines(feature["geometry"]):
        line = list(raw_line)
        if points and haversine(points[-1], line[-1]) < haversine(points[-1], line[0]):
            line.reverse()
        if points and points[-1] == line[0]:
            points.extend(line[1:])
        else:
            points.extend(line)

    properties = feature["properties"]
    start = valid_point(properties.get("StartX"), properties.get("StartY"))
    if start and haversine(points[-1], start) < haversine(points[0], start):
        points.reverse()
    return points


def cumulative_lengths(points: list[tuple[float, float]]) -> list[float]:
    lengths = [0.0]
    for start, end in zip(points, points[1:]):
        lengths.append(lengths[-1] + haversine(start, end))
    return lengths


def nearest_on_line(
    point: tuple[float, float], points: list[tuple[float, float]]
) -> tuple[float, tuple[float, float], float]:
    """Return distance, snapped point and fraction along an ordered line."""
    lon0, lat0 = point
    cosine = math.cos(math.radians(lat0))
    cumulative = cumulative_lengths(points)
    total = cumulative[-1]
    best_distance = math.inf
    best_point = points[0]
    best_fraction = 0.0

    for index, (start, end) in enumerate(zip(points, points[1:])):
        ax = math.radians(start[0] - lon0) * EARTH_RADIUS_M * cosine
        ay = math.radians(start[1] - lat0) * EARTH_RADIUS_M
        bx = math.radians(end[0] - lon0) * EARTH_RADIUS_M * cosine
        by = math.radians(end[1] - lat0) * EARTH_RADIUS_M
        dx, dy = bx - ax, by - ay
        denominator = dx * dx + dy * dy
        projection = max(0.0, min(1.0, -(ax * dx + ay * dy) / denominator)) if denominator else 0.0
        distance = math.hypot(ax + projection * dx, ay + projection * dy)
        if distance < best_distance:
            best_distance = distance
            best_point = (
                start[0] + projection * (end[0] - start[0]),
                start[1] + projection * (end[1] - start[1]),
            )
            along = cumulative[index] + projection * (cumulative[index + 1] - cumulative[index])
            best_fraction = along / total if total else 0.0

    return best_distance, best_point, best_fraction


def point_at_fraction(points: list[tuple[float, float]], fraction: float) -> tuple[float, float]:
    cumulative = cumulative_lengths(points)
    target = max(0.0, min(1.0, fraction)) * cumulative[-1]
    for index, end_distance in enumerate(cumulative[1:]):
        if target <= end_distance:
            start_distance = cumulative[index]
            segment_length = end_distance - start_distance
            segment_fraction = (target - start_distance) / segment_length if segment_length else 0.0
            start, end = points[index], points[index + 1]
            return (
                start[0] + segment_fraction * (end[0] - start[0]),
                start[1] + segment_fraction * (end[1] - start[1]),
            )
    return points[-1]


def chainage_bounds(properties: dict[str, Any]) -> tuple[float, float]:
    start = number(properties.get("Chainage_1")) or 0.0
    end = number(properties.get("Chainage_2"))
    if end is None:
        end = start + (number(properties.get("Length_km_")) or 0.0)
    return start, end


def feature_bbox(feature: dict[str, Any]) -> tuple[float, float, float, float]:
    points = [point for line in geometry_lines(feature["geometry"]) for point in line]
    return (
        min(point[0] for point in points),
        min(point[1] for point in points),
        max(point[0] for point in points),
        max(point[1] for point in points),
    )


def nearest_feature(
    point: tuple[float, float],
    features: list[dict[str, Any]],
    boxes: list[tuple[float, float, float, float]],
) -> tuple[dict[str, Any], float]:
    lon, lat = point
    candidates: list[tuple[float, int]] = []
    for index, (min_lon, min_lat, max_lon, max_lat) in enumerate(boxes):
        dx = max(min_lon - lon, 0.0, lon - max_lon) * 111_000 * math.cos(math.radians(lat))
        dy = max(min_lat - lat, 0.0, lat - max_lat) * 111_000
        candidates.append((math.hypot(dx, dy), index))

    best_feature: dict[str, Any] | None = None
    best_distance = math.inf
    for _, index in sorted(candidates)[:30]:
        feature = features[index]
        distance, _, _ = nearest_on_line(point, ordered_points(feature))
        if distance < best_distance:
            best_feature, best_distance = feature, distance
    assert best_feature is not None
    return best_feature, best_distance


def source_point(record: dict[str, Any]) -> tuple[tuple[float, float] | None, str]:
    point = valid_point(record.get("Lon"), record.get("Lat"))
    if point:
        return point, "coordinate"

    east, south = record.get("CoOrdinateE"), record.get("CoOrdinateS")
    point = valid_point(east, south)
    if point:
        return point, "raw-coordinate"
    point = valid_point(south, east)
    if point:
        return point, "swapped-coordinate"
    return None, "missing-coordinate"


def apply_link_attributes(
    record: dict[str, Any], feature: dict[str, Any], road_attributes: dict[str, dict[str, Any]]
) -> None:
    properties = feature["properties"]
    link_id = str(properties.get("Link_ID_1") or "").strip()
    source = road_attributes.get(link_id, {})
    for key, value in source.items():
        if not key.startswith("Unnamed:") and key != "Link_ID":
            record[key] = value
    record["SectionOrLinkNo"] = link_id
    record["Road"] = properties.get("Link_Name") or record.get("Road", "")
    record["Road_Class"] = properties.get("Road_Cla_1") or source.get("Road_Class", "")
    record["Link_Name"] = properties.get("Link_Name") or source.get("Link_Name", "")
    record["Chainage_From"] = number(properties.get("Chainage_1")) or 0.0
    record["Chainage_To"] = number(properties.get("Chainage_2")) or 0.0
    record["Length(km)"] = number(properties.get("Length_km_")) or 0.0
    record["Surface_Type"] = properties.get("Surface__1") or source.get("Surface_Type", "")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Write corrected JSON and GeoJSON files")
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    culvert_path = root / "public/data/culverts.json"
    network_path = root / "public/data/spatial/network2026.geojson"
    road_path = root / "public/data/road_network.json"
    geojson_path = root / "public/data/spatial/major_culverts.geojson"

    culverts = json.loads(culvert_path.read_text(encoding="utf-8"))
    features = json.loads(network_path.read_text(encoding="utf-8"))["features"]
    road_rows = json.loads(road_path.read_text(encoding="utf-8"))
    road_attributes = {str(row.get("Link_ID") or "").strip(): row for row in road_rows}
    feature_by_link = {
        str(feature["properties"].get("Link_ID_1") or "").strip(): feature for feature in features
    }
    boxes = [feature_bbox(feature) for feature in features]

    counts = {
        "snapped": 0,
        "assigned_nearest_link": 0,
        "located_from_chainage": 0,
        "located_at_link_midpoint": 0,
        "missing_link_geometry": 0,
    }
    maximum_snap = 0.0

    for record in culverts:
        link_id = str(record.get("SectionOrLinkNo") or "").strip()
        feature = feature_by_link.get(link_id)
        point, point_method = source_point(record)

        if feature is None and not link_id and point is not None:
            feature, _ = nearest_feature(point, features, boxes)
            counts["assigned_nearest_link"] += 1
        elif feature is None:
            # C459 is present in the link register but its geometry is absent
            # from network2026.geojson. Preserve its surveyed values.
            counts["missing_link_geometry"] += 1
            continue

        apply_link_attributes(record, feature, road_attributes)
        points = ordered_points(feature)
        chainage_start, chainage_end = chainage_bounds(feature["properties"])

        if point is not None:
            snap_distance, snapped, fraction = nearest_on_line(point, points)
            maximum_snap = max(maximum_snap, snap_distance)
            recorded_chainage = number(record.get("Km"))

            if snap_distance > FAR_FROM_LINK_M and recorded_chainage is not None:
                low, high = sorted((chainage_start, chainage_end))
                link_length = abs(chainage_end - chainage_start)
                if low <= recorded_chainage <= high:
                    chainage = recorded_chainage
                elif 0.0 <= recorded_chainage <= link_length:
                    direction = 1.0 if chainage_end >= chainage_start else -1.0
                    chainage = chainage_start + direction * recorded_chainage
                else:
                    chainage = chainage_start + fraction * (chainage_end - chainage_start)
                fraction = (
                    (chainage - chainage_start) / (chainage_end - chainage_start)
                    if chainage_end != chainage_start
                    else 0.0
                )
                snapped = point_at_fraction(points, fraction)
                counts["located_from_chainage"] += 1
            else:
                chainage = chainage_start + fraction * (chainage_end - chainage_start)
                counts["snapped"] += 1
        else:
            recorded_chainage = number(record.get("Km"))
            low, high = sorted((chainage_start, chainage_end))
            if recorded_chainage is not None:
                chainage = max(low, min(high, recorded_chainage))
                fraction = (
                    (chainage - chainage_start) / (chainage_end - chainage_start)
                    if chainage_end != chainage_start
                    else 0.0
                )
                counts["located_from_chainage"] += 1
            else:
                fraction = 0.5
                chainage = chainage_start + 0.5 * (chainage_end - chainage_start)
                counts["located_at_link_midpoint"] += 1
            snapped = point_at_fraction(points, fraction)

        lon, lat = snapped
        record["Lon"] = round(lon, 7)
        record["Lat"] = round(lat, 7)
        record["CoOrdinateE"] = round(lon, 7)
        record["CoOrdinateS"] = round(lat, 7)
        # Inventory chainage is cumulative from the start of the road. It is
        # never reset to zero at the start of an individual link.
        record["Km"] = round(chainage, 3)
        if "KmPrincipal" in record:
            record["KmPrincipal"] = record["Km"]

    geojson = {
        "type": "FeatureCollection",
        "name": "major_culverts",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"},
        },
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [record["Lon"], record["Lat"]]},
                "properties": {key: value for key, value in record.items() if key not in {"Lat", "Lon"}},
            }
            for record in culverts
            if valid_point(record.get("Lon"), record.get("Lat")) is not None
        ],
    }

    print(json.dumps({**counts, "records": len(culverts), "maximum_original_offset_m": round(maximum_snap, 1)}, indent=2))
    if args.apply:
        culvert_path.write_text(
            json.dumps(culverts, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )
        feature_lines = ",\n".join(
            json.dumps(feature, ensure_ascii=False, separators=(",", ":"))
            for feature in geojson["features"]
        )
        geojson_path.write_text(
            "{\n"
            '"type": "FeatureCollection",\n'
            '"name": "major_culverts",\n'
            '"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },\n'
            '"features": [\n'
            + feature_lines
            + "\n]\n}\n",
            encoding="utf-8",
        )


if __name__ == "__main__":
    main()
