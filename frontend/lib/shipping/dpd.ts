/**
 * DPD parcel machine / pickup points for Latvia, Estonia, Lithuania.
 * Full integration with DPD eserviss.dpd.lv API v1 for:
 * - Fetching pickup points (lockers/parcelshops)
 * - Creating shipments
 * - Generating shipping labels
 *
 * Required Env Variables:
 *   DPD_USERNAME - Your DPD eserviss username (email)
 *   DPD_PASSWORD - Your DPD eserviss password
 *
 * @see https://eserviss.dpd.lv/api
 * @see DPD API documentation v1.2.1
 */

export const DPD_PARCEL_MACHINE_METHOD_ID = "dpd-parcel-machine";

export const DPD_BALTIC_COUNTRIES = ["LV", "EE", "LT"] as const;

const DPD_API_BASE = "https://eserviss.dpd.lv/api/v1";

export type DpdPickupPoint = {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
};

export type DpdShipmentResult = {
  success: boolean;
  shipmentId?: string;
  trackingNumber?: string;
  labelPdf?: string; // Base64 encoded PDF
  error?: string;
};

export type DpdShipmentRequest = {
  senderName: string;
  senderStreet: string;
  senderStreetNo?: string;
  senderCity: string;
  senderPostalCode: string;
  senderCountry: string;
  senderPhone: string;
  senderEmail: string;
  recipientName: string;
  recipientStreet?: string;
  recipientStreetNo?: string;
  recipientCity?: string;
  recipientPostalCode?: string;
  recipientCountry: string;
  recipientPhone: string;
  recipientEmail: string;
  pudoId?: string; // Pickup point ID for PUDO delivery
  weight: number; // in kg
  reference: string; // order number
};

// In-memory token cache
let cachedToken: { token: string; expiresAt: Date } | null = null;

function getDpdCredentials() {
  return {
    username: process.env.DPD_USERNAME || "",
    password: process.env.DPD_PASSWORD || "",
  };
}

function hasDpdCredentials(): boolean {
  const { username, password } = getDpdCredentials();
  return !!(username && password);
}

/**
 * Get or create a Bearer token for DPD API
 * Tokens are cached in memory and reused until they expire
 */
async function getOrCreateBearerToken(): Promise<string | null> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > new Date()) {
    return cachedToken.token;
  }

  const { username, password } = getDpdCredentials();
  if (!username || !password) {
    console.error("[DPD API] No credentials configured");
    return null;
  }

  try {
    // Create token using Basic auth
    const basicAuth = Buffer.from(`${username}:${password}`, "utf-8").toString("base64");
    
    const response = await fetch(`${DPD_API_BASE}/auth/tokens`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `yerbatea-api-${Date.now()}`,
        ttl: 86400, // 24 hours in seconds
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DPD API] Token creation failed:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const token = data.token;
    const validUntil = data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 86400000);

    if (!token) {
      console.error("[DPD API] No token in response:", data);
      return null;
    }

    // Cache the token
    cachedToken = {
      token,
      expiresAt: validUntil,
    };

    console.log("[DPD API] New token created, valid until:", validUntil);
    return token;
  } catch (error) {
    console.error("[DPD API] Error creating token:", error);
    return null;
  }
}

/** Raw shape from DPD API /lockers endpoint */
type ApiLockerPoint = {
  id?: string;
  name?: string;
  lockerType?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  [key: string]: unknown;
};

function mapApiLockerToPickupPoint(locker: ApiLockerPoint): DpdPickupPoint | null {
  const id = String(locker.id ?? "").trim();
  const name = String(locker.name ?? "DPD Pickup").trim();
  const address = locker.address;
  
  if (!id) return null;
  
  return {
    id,
    name,
    address: address?.street || "-",
    city: address?.city || "-",
    postalCode: address?.postalCode || "-",
    country: address?.country || "LV",
  };
}

/**
 * Fetch pickup points from DPD API /lockers endpoint
 */
export async function fetchDpdPickupPointsFromApi(country: string): Promise<DpdPickupPoint[]> {
  if (!hasDpdCredentials()) {
    console.log("[DPD] No credentials configured, using static list");
    return getDpdPickupPoints(country);
  }

  const code = country.toUpperCase();
  if (!DPD_BALTIC_COUNTRIES.includes(code as (typeof DPD_BALTIC_COUNTRIES)[number])) {
    return [];
  }

  const token = await getOrCreateBearerToken();
  if (!token) {
    console.warn("[DPD API] Failed to get token, using static list");
    return getDpdPickupPoints(country);
  }

  try {
    const response = await fetch(`${DPD_API_BASE}/lockers?countryCode=${code}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json+fulldata",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(`[DPD API] Pickup points request failed: ${response.status}`);
      const errorText = await response.text();
      console.warn("[DPD API] Error:", errorText);
      return getDpdPickupPoints(country);
    }

    const data = await response.json();
    const lockers: ApiLockerPoint[] = Array.isArray(data) ? data : [];

    const points = lockers
      .map((locker) => mapApiLockerToPickupPoint(locker))
      .filter((p): p is DpdPickupPoint => p !== null);

    console.log(`[DPD API] Fetched ${points.length} pickup points for ${code}`);
    
    if (points.length > 0) {
      return points;
    }
  } catch (error) {
    console.warn("[DPD API] Failed to fetch pickup points:", error);
  }

  return getDpdPickupPoints(country);
}

/**
 * Create a DPD shipment and generate a shipping label
 */
export async function createDpdShipment(request: DpdShipmentRequest): Promise<DpdShipmentResult> {
  if (!hasDpdCredentials()) {
    return {
      success: false,
      error: "DPD credentials not configured",
    };
  }

  const token = await getOrCreateBearerToken();
  if (!token) {
    return {
      success: false,
      error: "Failed to authenticate with DPD API",
    };
  }

  try {
    // Determine service type based on whether it's a PUDO delivery
    const isPudo = !!request.pudoId;
    
    // Build shipment request payload according to DPD API v1.2.1 spec
    const shipmentPayload = [
      {
        senderAddress: {
          name: request.senderName,
          email: request.senderEmail,
          phone: request.senderPhone,
          street: request.senderStreet,
          streetNo: request.senderStreetNo || "",
          city: request.senderCity,
          postalCode: request.senderPostalCode.replace(/[^0-9]/g, ""), // Remove non-numeric chars
          country: request.senderCountry,
        },
        receiverAddress: isPudo
          ? {
              name: request.recipientName,
              email: request.recipientEmail,
              phone: request.recipientPhone,
              pudoId: request.pudoId,
            }
          : {
              name: request.recipientName,
              email: request.recipientEmail,
              phone: request.recipientPhone,
              street: request.recipientStreet || "",
              streetNo: request.recipientStreetNo || "",
              city: request.recipientCity || "",
              postalCode: (request.recipientPostalCode || "").replace(/[^0-9]/g, ""),
              country: request.recipientCountry,
            },
        service: {
          serviceAlias: isPudo ? "PICKUP" : "DPD B2C",
        },
        parcels: [
          {
            weight: request.weight,
            mpsReferences: [request.reference],
          },
        ],
        shipmentReferences: [request.reference],
        // Include label options to get label in same request
        labelOptions: {
          downloadLabel: true,
          labelFormat: "application/pdf",
          paperSize: "A6",
        },
      },
    ];

    console.log("[DPD API] Creating shipment with payload:", JSON.stringify(shipmentPayload, null, 2));

    // Create shipment
    const createResponse = await fetch(`${DPD_API_BASE}/shipments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shipmentPayload),
    });

    const responseText = await createResponse.text();
    console.log("[DPD API] Shipment response status:", createResponse.status);
    console.log("[DPD API] Shipment response:", responseText);

    if (!createResponse.ok) {
      console.error("[DPD API] Shipment creation failed:", responseText);
      return {
        success: false,
        error: `Shipment creation failed: ${createResponse.status} - ${responseText}`,
      };
    }

    let shipmentData;
    try {
      shipmentData = JSON.parse(responseText);
    } catch {
      return {
        success: false,
        error: "Invalid JSON response from DPD API",
      };
    }

    // Handle array response (batch shipment creation returns array)
    const shipment = Array.isArray(shipmentData) ? shipmentData[0] : shipmentData;
    
    const shipmentId = shipment?.id;
    const parcelNumbers = shipment?.parcelNumbers || shipment?.parcels?.map((p: { parcelNumber?: string }) => p.parcelNumber) || [];
    const trackingNumber = parcelNumbers[0] || shipment?.parcelNumber;

    if (!shipmentId) {
      return {
        success: false,
        error: "No shipment ID returned from DPD API",
      };
    }

    // Check if label was included in response
    let labelPdf: string | undefined;
    
    // Try different paths where label data might be
    const labelData = 
      shipment?.shipmentLabels?.pages?.[0]?.binaryData ||
      shipment?.labels?.pages?.[0]?.binaryData ||
      shipment?.label?.binaryData ||
      shipment?.labelData;
    
    console.log("[DPD API] Label data found in response:", !!labelData);
    console.log("[DPD API] shipmentLabels structure:", JSON.stringify(shipment?.shipmentLabels, null, 2));
    
    if (labelData) {
      let rawLabel = String(labelData);
      console.log("[DPD API] Label extracted from shipment response");
      console.log("[DPD API] Original length:", rawLabel.length);
      console.log("[DPD API] First 100 chars raw:", rawLabel.substring(0, 100));
      
      // Check if it's a data URL and extract just the base64 part
      if (rawLabel.includes("base64,")) {
        rawLabel = rawLabel.split("base64,")[1] || rawLabel;
        console.log("[DPD API] Extracted base64 from data URL");
      }
      
      // Clean whitespace only - preserve valid base64 chars
      labelPdf = rawLabel.replace(/[\s\r\n]/g, "");
      console.log("[DPD API] Cleaned length:", labelPdf.length);
    } else {
      // Fetch label separately if not in response
      console.log("[DPD API] Fetching label separately for shipment:", shipmentId);
      const labelResult = await getDpdShipmentLabel(shipmentId, token);
      console.log("[DPD API] Separate label fetch result:", labelResult.success, labelResult.error);
      if (labelResult.success && labelResult.labelPdf) {
        // Already cleaned in getDpdShipmentLabel
        labelPdf = labelResult.labelPdf;
        console.log("[DPD API] Label fetched separately, cleaned length:", labelPdf.length);
      }
    }

    return {
      success: true,
      shipmentId,
      trackingNumber,
      labelPdf,
    };
  } catch (error) {
    console.error("[DPD API] Error creating shipment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get shipping label for an existing shipment
 */
export async function getDpdShipmentLabel(
  shipmentId: string,
  existingToken?: string
): Promise<{ success: boolean; labelPdf?: string; error?: string }> {
  const token = existingToken || (await getOrCreateBearerToken());
  if (!token) {
    return { success: false, error: "Failed to authenticate with DPD API" };
  }

  try {
    const response = await fetch(`${DPD_API_BASE}/shipments/labels`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shipmentIds: [shipmentId],
        downloadLabel: true,
        labelFormat: "application/pdf",
        paperSize: "A6",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DPD API] Label fetch failed:", errorText);
      return { success: false, error: `Label fetch failed: ${response.status}` };
    }

    const data = await response.json();
    console.log("[DPD API] Label response structure:", JSON.stringify(data, null, 2).substring(0, 500));
    
    let rawLabel = data?.pages?.[0]?.binaryData;

    if (!rawLabel) {
      return { success: false, error: "No label data in response" };
    }

    rawLabel = String(rawLabel);
    console.log("[DPD API] Label fetched, original length:", rawLabel.length);
    console.log("[DPD API] First 100 chars raw:", rawLabel.substring(0, 100));
    
    // Check if it's a data URL and extract just the base64 part
    if (rawLabel.includes("base64,")) {
      rawLabel = rawLabel.split("base64,")[1] || rawLabel;
      console.log("[DPD API] Extracted base64 from data URL");
    }
    
    // Clean whitespace only
    const labelPdf = rawLabel.replace(/[\s\r\n]/g, "");
    console.log("[DPD API] Cleaned length:", labelPdf.length);

    return { success: true, labelPdf }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/** Static list of pickup points. Used when API fails or for development. */
const PICKUP_POINTS: Record<string, DpdPickupPoint[]> = {
  LV: [
    { id: "LV90001", name: "DPD Pickup Rīga - Centrs", address: "Brīvības iela 1", city: "Rīga", postalCode: "1010", country: "LV" },
    { id: "LV90002", name: "DPD Pickup Rīga - Ziemeļi", address: "Dzirciema iela 120", city: "Rīga", postalCode: "1006", country: "LV" },
    { id: "LV90003", name: "DPD Pickup Rīga - Ķengarags", address: "Maskavas iela 250", city: "Rīga", postalCode: "1063", country: "LV" },
    { id: "LV90004", name: "DPD Pickup Rīga - Purvciems", address: "Daugavgrīvas iela 2", city: "Rīga", postalCode: "1007", country: "LV" },
    { id: "LV90005", name: "DPD Pickup Rīga - Imanta", address: "Kurzemes prospekts 1a", city: "Rīga", postalCode: "1067", country: "LV" },
    { id: "LV90006", name: "DPD Pickup Rīga - Alfa", address: "Brīvības iela 372", city: "Rīga", postalCode: "1006", country: "LV" },
    { id: "LV90007", name: "DPD Pickup Rīga - Pļavnieki", address: "Mūkusalas iela 41", city: "Rīga", postalCode: "1004", country: "LV" },
    { id: "LV90008", name: "DPD Pickup Rīga - Teika", address: "Katoļu iela 1", city: "Rīga", postalCode: "1003", country: "LV" },
    { id: "LV90009", name: "DPD Pickup Rīga - Bolderāja", address: "Daugavgrīvas iela 118", city: "Rīga", postalCode: "1007", country: "LV" },
    { id: "LV90010", name: "DPD Pickup Rīga - Spice", address: "Lielirbes iela 29", city: "Rīga", postalCode: "1046", country: "LV" },
    { id: "LV90011", name: "DPD Pickup Daugavpils", address: "Saules iela 22", city: "Daugavpils", postalCode: "5401", country: "LV" },
    { id: "LV90012", name: "DPD Pickup Liepāja", address: "Graudu iela 68", city: "Liepāja", postalCode: "3401", country: "LV" },
    { id: "LV90013", name: "DPD Pickup Jelgava", address: "Lielā iela 32", city: "Jelgava", postalCode: "3001", country: "LV" },
    { id: "LV90014", name: "DPD Pickup Ventspils", address: "Dārzu iela 4", city: "Ventspils", postalCode: "3601", country: "LV" },
    { id: "LV90015", name: "DPD Pickup Rēzekne", address: "Atbrīvošanas aleja 98", city: "Rēzekne", postalCode: "4601", country: "LV" },
    { id: "LV90016", name: "DPD Pickup Valmiera", address: "Rīgas iela 10", city: "Valmiera", postalCode: "4201", country: "LV" },
    { id: "LV90017", name: "DPD Pickup Jūrmala", address: "Tirgoņu iela 2", city: "Jūrmala", postalCode: "2015", country: "LV" },
    { id: "LV90018", name: "DPD Pickup Ogre", address: "Brīvības iela 15", city: "Ogre", postalCode: "5001", country: "LV" },
  ],
  EE: [
    { id: "EE90001", name: "DPD Pickup Tallinn - Keskus", address: "Viru 2", city: "Tallinn", postalCode: "10111", country: "EE" },
    { id: "EE90002", name: "DPD Pickup Tallinn - Ülemiste", address: "Lennujaama tee 2", city: "Tallinn", postalCode: "11101", country: "EE" },
    { id: "EE90003", name: "DPD Pickup Tallinn - Kristiine", address: "Endla 45", city: "Tallinn", postalCode: "10114", country: "EE" },
    { id: "EE90004", name: "DPD Pickup Tartu", address: "Raekoja plats 1", city: "Tartu", postalCode: "51003", country: "EE" },
    { id: "EE90005", name: "DPD Pickup Pärnu", address: "Rüütli 30", city: "Pärnu", postalCode: "80010", country: "EE" },
    { id: "EE90006", name: "DPD Pickup Narva", address: "Puškini 13", city: "Narva", postalCode: "20305", country: "EE" },
  ],
  LT: [
    { id: "LT90001", name: "DPD Pickup Vilnius - Centras", address: "Gedimino pr. 1", city: "Vilnius", postalCode: "01103", country: "LT" },
    { id: "LT90002", name: "DPD Pickup Vilnius - Akropolis", address: "Ozo g. 25", city: "Vilnius", postalCode: "07150", country: "LT" },
    { id: "LT90003", name: "DPD Pickup Kaunas", address: "Laisvės al. 93", city: "Kaunas", postalCode: "44297", country: "LT" },
    { id: "LT90004", name: "DPD Pickup Klaipėda", address: "Tiltų g. 1", city: "Klaipėda", postalCode: "91234", country: "LT" },
    { id: "LT90005", name: "DPD Pickup Šiauliai", address: "Vilniaus g. 88", city: "Šiauliai", postalCode: "76285", country: "LT" },
    { id: "LT90006", name: "DPD Pickup Panevėžys", address: "Respublikos g. 42", city: "Panevėžys", postalCode: "35172", country: "LT" },
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

/** Seller/sender details for DPD shipments */
export const DPD_SENDER_DETAILS = {
  name: "SIA YerbaTea",
  street: "Ieriku iela",
  streetNo: "66-112",
  city: "Riga",
  postalCode: "1084",
  country: "LV",
  phone: "+37127552577",
  email: "orders@yerbatea.lv",
} as const;
