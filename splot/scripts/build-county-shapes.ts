/**
 * Builds data/malopolska-counties.svg.json: simplified SVG paths of the 22
 * Małopolska counties for the Challenge Map (/challenges, SPL-39).
 *
 * Source: powiaty-medium.geojson from github.com/ppatrzyk/polska-geojson
 * (MIT, boundaries from the PRG/GUGiK register). Pass a local copy as the
 * first argument to skip the download:
 *
 *   pnpm data:counties [path/to/powiaty-medium.geojson]
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import counties from "../data/county-indicators.json";

const SOURCE_URL =
  "https://raw.githubusercontent.com/ppatrzyk/polska-geojson/master/powiaty/powiaty-medium.geojson";
const OUTPUT = join(import.meta.dirname, "..", "data", "malopolska-counties.svg.json");
/** Width of the viewBox; the height follows the region's shape. */
const WIDTH = 800;
/** Douglas–Peucker tolerance in viewBox units. */
const TOLERANCE = 0.7;
/** Małopolska, to tell „powiat brzeski” apart from its namesake in Opolskie. */
const BOX = { minLon: 18.9, maxLon: 21.6, minLat: 49, maxLat: 50.6 };

type Point = [number, number];
type Ring = Point[];
type Feature = {
  properties: { nazwa: string };
  geometry: { type: "Polygon"; coordinates: Ring[] } | { type: "MultiPolygon"; coordinates: Ring[][] };
};

/** „powiat m. Kraków” in our data is „powiat Kraków” in the source. */
function sourceName(name: string) {
  return name.replace("powiat m. ", "powiat ");
}

function polygons(feature: Feature): Ring[][] {
  return feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
}

function inBox(feature: Feature) {
  const [lon, lat] = polygons(feature)[0][0][0];
  return lon > BOX.minLon && lon < BOX.maxLon && lat > BOX.minLat && lat < BOX.maxLat;
}

function distanceToSegment([x, y]: Point, [x1, y1]: Point, [x2, y2]: Point) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / length));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length < 3) return points;
  let index = 0;
  let max = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const distance = distanceToSegment(points[i], points[0], points[points.length - 1]);
    if (distance > max) {
      max = distance;
      index = i;
    }
  }
  if (max <= tolerance) return [points[0], points[points.length - 1]];
  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ];
}

async function loadSource(path: string | undefined): Promise<{ features: Feature[] }> {
  if (path) return JSON.parse(await readFile(path, "utf8"));
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`${SOURCE_URL}: ${response.status}`);
  return response.json();
}

async function main() {
  const source = await loadSource(process.argv[2]);
  const features = counties.counties.map((county) => {
    const feature = source.features.find(
      (item) => item.properties.nazwa === sourceName(county.name) && inBox(item),
    );
    if (!feature) throw new Error(`No boundary for ${county.name}`);
    return { code: county.code, feature };
  });

  const all = features.flatMap(({ feature }) => polygons(feature).flat(2));
  const minLon = Math.min(...all.map(([lon]) => lon));
  const maxLon = Math.max(...all.map(([lon]) => lon));
  const minLat = Math.min(...all.map(([, lat]) => lat));
  const maxLat = Math.max(...all.map(([, lat]) => lat));
  // Equirectangular with the mid-latitude correction: accurate enough for one region.
  const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const scale = WIDTH / ((maxLon - minLon) * kx);
  const height = Math.ceil((maxLat - minLat) * scale);
  const project = ([lon, lat]: Point): Point => [(lon - minLon) * kx * scale, (maxLat - lat) * scale];
  const round = (value: number) => Math.round(value * 10) / 10;

  const shapes = features.map(({ code, feature }) => {
    const rings = polygons(feature)
      .flat()
      .map((ring) => simplify(ring.map(project), TOLERANCE))
      .filter((ring) => ring.length >= 4);
    const d = rings
      .map((ring) => `M${ring.slice(0, -1).map(([x, y]) => `${round(x)} ${round(y)}`).join("L")}Z`)
      .join("");
    return { code, d };
  });

  const output = {
    source: {
      title: "Granice powiatów (PRG, GUGiK), uproszczone",
      url: "https://github.com/ppatrzyk/polska-geojson",
      license: "MIT",
    },
    viewBox: `0 0 ${WIDTH} ${height}`,
    counties: shapes,
  };
  await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
  const size = shapes.reduce((sum, shape) => sum + shape.d.length, 0);
  console.log(`Wrote ${shapes.length} counties, ${Math.round(size / 1024)} KB of paths, to ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
