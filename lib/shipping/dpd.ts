/**
 * DPD parcel machine / pickup points for Latvia, Estonia, Lithuania.
 * Fetches from eserviss.dpd.lv API when credentials are set; otherwise uses static list.
 *
 * Env (optional): set one of:
 *   - DPD_ESERVISS_CREDENTIALS_BASE64 = base64("username:password") for Basic auth
 *   - DPD_ESERVISS_USERNAME + DPD_ESERVISS_PASSWORD (plain; encoded to Basic auth)
 *
 * @see https://eserviss.dpd.lv/api#/Addressbook/101167d286e4f27b181a6524e4a17f24
 */

export const DPD_PARCEL_MACHINE_METHOD_ID = "dpd-parcel-machine";

export const DPD_BALTIC_COUNTRIES = ["LV", "EE", "LT"] as const;

const DPD_ESERVISS_API_BASE = "https://eserviss.dpd.lv/api";

export type DpdPickupPoint = {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
};

/** Build Basic auth header. Supports base64-encoded "username:password" or separate username/password. */
function getBasicAuthHeader(): string | null {
  const credsBase64 = process.env.DPD_ESERVISS_CREDENTIALS_BASE64;
  if (credsBase64) {
    return `Basic ${credsBase64.trim()}`;
  }
  const user = process.env.DPD_ESERVISS_USERNAME;
  const pass = process.env.DPD_ESERVISS_PASSWORD;
  if (user && pass) {
    return `Basic ${Buffer.from(`${user}:${pass}`, "utf-8").toString("base64")}`;
  }
  return null;
}

/** Raw shape we accept from eserviss.dpd.lv Addressbook (field names may vary). */
type ApiAddressRow = {
  id?: string;
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  [key: string]: unknown;
};

function mapApiRowToPickupPoint(row: ApiAddressRow, country: string): DpdPickupPoint | null {
  const id = String(row.id ?? row.name ?? "").trim();
  const name = String(row.name ?? row.id ?? "Pickup").trim();
  const address = String(row.address ?? "").trim();
  const city = String(row.city ?? "").trim();
  const postalCode = String(row.postalCode ?? row.postal_code ?? "").trim();
  const countryCode = (row.country ?? row.countryCode ?? country).toString().toUpperCase().slice(0, 2);
  if (!id || !name) return null;
  return {
    id,
    name,
    address: address || "-",
    city: city || "-",
    postalCode: postalCode || "-",
    country: countryCode || country.toUpperCase(),
  };
}

/**
 * Fetch all addresses from eserviss.dpd.lv Addressbook API.
 * Requires DPD_ESERVISS_CREDENTIALS_BASE64 (base64 of "username:password") or
 * DPD_ESERVISS_USERNAME + DPD_ESERVISS_PASSWORD.
 */
export async function fetchDpdPickupPointsFromApi(country: string): Promise<DpdPickupPoint[]> {
  const auth = getBasicAuthHeader();
  if (!auth) return [];

  const code = country.toUpperCase();
  if (!DPD_BALTIC_COUNTRIES.includes(code as (typeof DPD_BALTIC_COUNTRIES)[number])) {
    return [];
  }

  const urlsToTry = [
    `${DPD_ESERVISS_API_BASE}/Addressbook`,
    `${DPD_ESERVISS_API_BASE}/addressbook`,
  ];

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: auth,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 404) continue;
        console.warn(`[DPD API] ${url} returned ${res.status}`);
        return [];
      }

      const data = (await res.json()) as ApiAddressRow[] | { data?: ApiAddressRow[]; list?: ApiAddressRow[]; items?: ApiAddressRow[] };
      const rows: ApiAddressRow[] = Array.isArray(data)
        ? data
        : (data as { data?: ApiAddressRow[] }).data ??
          (data as { list?: ApiAddressRow[] }).list ??
          (data as { items?: ApiAddressRow[] }).items ??
          [];

      const points = rows
        .map((row) => mapApiRowToPickupPoint(row, code))
        .filter((p): p is DpdPickupPoint => p !== null)
        .filter((p) => p.country === code);
      return points;
    } catch (e) {
      console.warn(`[DPD API] fetch failed for ${url}:`, e);
    }
  }
  return [];
}

/** Static list of pickup points. Used when API credentials are not set or API fails. */
const PICKUP_POINTS: Record<string, DpdPickupPoint[]> = {
  LV: [
    { id: "LV-RIGA-001", name: "DPD Pickup Rīga - Centrs", address: "Brīvības iela 1", city: "Rīga", postalCode: "LV-1010", country: "LV" },
    { id: "LV-RIGA-002", name: "DPD Pickup Rīga - Ziemeļi", address: "Dzirciema iela 120", city: "Rīga", postalCode: "LV-1006", country: "LV" },
    { id: "LV-RIGA-003", name: "DPD Parcel Shop Rīga - Ķengarags", address: "Maskavas iela 250", city: "Rīga", postalCode: "LV-1003", country: "LV" },
    { id: "LV-RIGA-004", name: "DPD Pickup Rīga - Purvciems", address: "Daugavgrīvas iela 2", city: "Rīga", postalCode: "LV-1007", country: "LV" },
    { id: "LV-RIGA-005", name: "DPD Pickup Rīga - Imanta", address: "Kurzemes prospekts 1a", city: "Rīga", postalCode: "LV-1067", country: "LV" },
    { id: "LV-RIGA-006", name: "DPD Parcel Shop Rīga - Alfa", address: "Brīvības iela 372", city: "Rīga", postalCode: "LV-1026", country: "LV" },
    { id: "LV-RIGA-007", name: "DPD Pickup Rīga - Pļavnieki", address: "Mūkusalas iela 41", city: "Rīga", postalCode: "LV-1004", country: "LV" },
    { id: "LV-RIGA-008", name: "DPD Pickup Rīga - Teika", address: "Katoļu iela 1", city: "Rīga", postalCode: "LV-1005", country: "LV" },
    { id: "LV-RIGA-009", name: "DPD Pickup Rīga - Bolderāja", address: "Daugavgrīvas iela 118", city: "Rīga", postalCode: "LV-1007", country: "LV" },
    { id: "LV-RIGA-010", name: "DPD Parcel Shop Rīga - Spice", address: "Mūkusalas iela 71", city: "Rīga", postalCode: "LV-1004", country: "LV" },
    { id: "LV-DAUGAVPILS-001", name: "DPD Pickup Daugavpils", address: "Saules iela 22", city: "Daugavpils", postalCode: "LV-5401", country: "LV" },
    { id: "LV-DAUGAVPILS-002", name: "DPD Parcel Shop Daugavpils - Centrs", address: "Rīgas iela 68", city: "Daugavpils", postalCode: "LV-5401", country: "LV" },
    { id: "LV-LIEPAJA-001", name: "DPD Pickup Liepāja", address: "Graudu iela 68", city: "Liepāja", postalCode: "LV-3401", country: "LV" },
    { id: "LV-LIEPAJA-002", name: "DPD Parcel Shop Liepāja - Centrs", address: "Kūrmājas prospekts 20", city: "Liepāja", postalCode: "LV-3414", country: "LV" },
    { id: "LV-JELGAVA-001", name: "DPD Pickup Jelgava", address: "Lielā iela 32", city: "Jelgava", postalCode: "LV-3001", country: "LV" },
    { id: "LV-VENTSPILS-001", name: "DPD Pickup Ventspils", address: "Dārzu iela 4", city: "Ventspils", postalCode: "LV-3601", country: "LV" },
    { id: "LV-REZEKNE-001", name: "DPD Pickup Rēzekne", address: "Atbrīvošanas aleja 98", city: "Rēzekne", postalCode: "LV-4601", country: "LV" },
    { id: "LV-VALMIERA-001", name: "DPD Pickup Valmiera", address: "Rīgas iela 10", city: "Valmiera", postalCode: "LV-4201", country: "LV" },
    { id: "LV-JURMALA-001", name: "DPD Pickup Jūrmala - Majori", address: "Tirgoņu iela 2", city: "Jūrmala", postalCode: "LV-2015", country: "LV" },
    { id: "LV-OGRE-001", name: "DPD Pickup Ogre", address: "Brīvības iela 15", city: "Ogre", postalCode: "LV-5001", country: "LV" },
  ],
  EE: [
    { id: "EE-TALLINN-001", name: "DPD Pickup Tallinn - Keskus", address: "Viru 2", city: "Tallinn", postalCode: "10111", country: "EE" },
    { id: "EE-TALLINN-002", name: "DPD Parcel Shop Tallinn - Ülemiste", address: "Lennujaama tee 2", city: "Tallinn", postalCode: "11101", country: "EE" },
    { id: "EE-TALLINN-003", name: "DPD Pickup Tallinn - Kristiine", address: "Endla 45", city: "Tallinn", postalCode: "10114", country: "EE" },
    { id: "EE-TALLINN-004", name: "DPD Pickup Tallinn - Mustamäe", address: "Akadeemia tee 15", city: "Tallinn", postalCode: "12618", country: "EE" },
    { id: "EE-TALLINN-005", name: "DPD Parcel Shop Tallinn - Rocca al Mare", address: "Paldiski mnt 102", city: "Tallinn", postalCode: "13522", country: "EE" },
    { id: "EE-TALLINN-006", name: "DPD Pickup Tallinn - Lasnamäe", address: "Mustakivi tee 15", city: "Tallinn", postalCode: "13912", country: "EE" },
    { id: "EE-TALLINN-007", name: "DPD Pickup Tallinn - Nõmme", address: "Räägu 2", city: "Tallinn", postalCode: "11622", country: "EE" },
    { id: "EE-TALLINN-008", name: "DPD Pickup Tallinn - Pirita", address: "Pirita tee 26", city: "Tallinn", postalCode: "10127", country: "EE" },
    { id: "EE-TARTU-001", name: "DPD Pickup Tartu", address: "Raekoja plats 1", city: "Tartu", postalCode: "51003", country: "EE" },
    { id: "EE-TARTU-002", name: "DPD Parcel Shop Tartu - Lõunakeskus", address: "Ringtee 75", city: "Tartu", postalCode: "50113", country: "EE" },
    { id: "EE-TARTU-003", name: "DPD Pickup Tartu - Ülikooli", address: "Ülikooli 18", city: "Tartu", postalCode: "51003", country: "EE" },
    { id: "EE-PARNU-001", name: "DPD Pickup Pärnu", address: "Rüütli 30", city: "Pärnu", postalCode: "80010", country: "EE" },
    { id: "EE-PARNU-002", name: "DPD Parcel Shop Pärnu - Centrum", address: "Rüütli 42", city: "Pärnu", postalCode: "80010", country: "EE" },
    { id: "EE-NARVA-001", name: "DPD Pickup Narva", address: "Puškini 13", city: "Narva", postalCode: "20305", country: "EE" },
    { id: "EE-KOHILA-001", name: "DPD Pickup Kohila", address: "Pärnu mnt 1", city: "Kohila", postalCode: "79701", country: "EE" },
    { id: "EE-VILJANDI-001", name: "DPD Pickup Viljandi", address: "Tartu 18", city: "Viljandi", postalCode: "71020", country: "EE" },
    { id: "EE-RAPLA-001", name: "DPD Pickup Rapla", address: "Tallinna 12", city: "Rapla", postalCode: "79513", country: "EE" },
  ],
  LT: [
    { id: "LT-VILNIUS-001", name: "DPD Pickup Vilnius - Centras", address: "Gedimino pr. 1", city: "Vilnius", postalCode: "01103", country: "LT" },
    { id: "LT-VILNIUS-002", name: "DPD Parcel Shop Vilnius - Akropolis", address: "Ozo g. 25", city: "Vilnius", postalCode: "07150", country: "LT" },
    { id: "LT-VILNIUS-003", name: "DPD Pickup Vilnius - Šeškinė", address: "Verkių g. 29", city: "Vilnius", postalCode: "08222", country: "LT" },
    { id: "LT-VILNIUS-004", name: "DPD Pickup Vilnius - Justiniškės", address: "Justiniškių g. 80", city: "Vilnius", postalCode: "08100", country: "LT" },
    { id: "LT-VILNIUS-005", name: "DPD Parcel Shop Vilnius - Ozas", address: "Ozo g. 18", city: "Vilnius", postalCode: "07150", country: "LT" },
    { id: "LT-VILNIUS-006", name: "DPD Pickup Vilnius - Antakalnis", address: "Antakalnio g. 54", city: "Vilnius", postalCode: "10303", country: "LT" },
    { id: "LT-VILNIUS-007", name: "DPD Pickup Vilnius - Pašilaičiai", address: "Laisvės pr. 125", city: "Vilnius", postalCode: "06118", country: "LT" },
    { id: "LT-KAUNAS-001", name: "DPD Pickup Kaunas", address: "Laisvės al. 93", city: "Kaunas", postalCode: "44297", country: "LT" },
    { id: "LT-KAUNAS-002", name: "DPD Parcel Shop Kaunas - Mega", address: "Islandijos pl. 32", city: "Kaunas", postalCode: "47401", country: "LT" },
    { id: "LT-KAUNAS-003", name: "DPD Pickup Kaunas - Centras", address: "Vilniaus g. 28", city: "Kaunas", postalCode: "44287", country: "LT" },
    { id: "LT-KLAIPEDA-001", name: "DPD Pickup Klaipėda", address: "Tiltų g. 1", city: "Klaipėda", postalCode: "91234", country: "LT" },
    { id: "LT-KLAIPEDA-002", name: "DPD Parcel Shop Klaipėda - Akropolis", address: "Kauno g. 41", city: "Klaipėda", postalCode: "92294", country: "LT" },
    { id: "LT-SIAULIAI-001", name: "DPD Pickup Šiauliai", address: "Vilniaus g. 88", city: "Šiauliai", postalCode: "76285", country: "LT" },
    { id: "LT-SIAULIAI-002", name: "DPD Parcel Shop Šiauliai - Saulė", address: "Tilžės g. 109", city: "Šiauliai", postalCode: "76285", country: "LT" },
    { id: "LT-PANEVEZYS-001", name: "DPD Pickup Panevėžys", address: "Respublikos g. 42", city: "Panevėžys", postalCode: "35172", country: "LT" },
    { id: "LT-ALYTUS-001", name: "DPD Pickup Alytus", address: "J. Biliūno g. 4", city: "Alytus", postalCode: "62137", country: "LT" },
    { id: "LT-MARIJAMPOLE-001", name: "DPD Pickup Marijampolė", address: "Vytauto g. 15", city: "Marijampolė", postalCode: "68300", country: "LT" },
    { id: "LT-UTENA-001", name: "DPD Pickup Utena", address: "Aukštakalnio g. 22", city: "Utena", postalCode: "28143", country: "LT" },
  ],
};

export function getDpdPickupPoints(country: string): DpdPickupPoint[] {
  const code = country.toUpperCase();
  if (code === "LV" || code === "EE" || code === "LT") {
    return PICKUP_POINTS[code] ?? [];
  }
  return [];
}

export function isDpdAvailableForCountry(country: string): boolean {
  return DPD_BALTIC_COUNTRIES.includes(
    country.toUpperCase() as (typeof DPD_BALTIC_COUNTRIES)[number],
  );
}

export function getDpdPickupPointById(
  country: string,
  id: string,
): DpdPickupPoint | null {
  const points = getDpdPickupPoints(country);
  return points.find((p) => p.id === id) ?? null;
}
