import {
  completeMaksekeskusOrderFromReturn,
  type MaksekeskusPaymentReturn,
} from "@/lib/maksekeskus-order";
import { validatePaymentReturnMac } from "@/lib/maksekeskus";

export type ParsedMakseReturn = {
  jsonString: string;
  mac: string;
};

export async function parseMaksekeskusReturnRequest(
  request: Request,
): Promise<ParsedMakseReturn | null> {
  const contentType = request.headers.get("content-type") ?? "";
  const url = new URL(request.url);

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    const jsonString = formData.get("json")?.toString() ?? "";
    const mac = formData.get("mac")?.toString() ?? "";
    if (jsonString && mac) {
      return { jsonString, mac };
    }
  }

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    const jsonString = typeof body.json === "string" ? body.json : "";
    const mac = typeof body.mac === "string" ? body.mac : "";
    if (jsonString && mac) {
      return { jsonString, mac };
    }
  }

  const jsonFromQuery = url.searchParams.get("json");
  const macFromQuery = url.searchParams.get("mac");
  if (jsonFromQuery && macFromQuery) {
    return { jsonString: jsonFromQuery, mac: macFromQuery };
  }

  return null;
}

export async function processMaksekeskusReturnPayload(
  parsed: ParsedMakseReturn,
): Promise<boolean> {
  const valid = await validatePaymentReturnMac(parsed.jsonString, parsed.mac);
  if (!valid) {
    console.error("[maksekeskus return] Invalid MAC");
    return false;
  }

  let payload: MaksekeskusPaymentReturn;
  try {
    payload = JSON.parse(parsed.jsonString) as MaksekeskusPaymentReturn;
  } catch {
    return false;
  }

  return completeMaksekeskusOrderFromReturn(payload);
}
