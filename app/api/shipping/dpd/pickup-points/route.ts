import { NextResponse } from "next/server";
import {
  fetchDpdPickupPointsFromApi,
  getDpdPickupPoints,
  isDpdAvailableForCountry,
} from "@/lib/shipping/dpd";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country") ?? "";

  if (!country) {
    return NextResponse.json(
      { error: "Country parameter required" },
      { status: 400 },
    );
  }

  if (!isDpdAvailableForCountry(country)) {
    return NextResponse.json(
      { error: "DPD parcel machine is not available for this country" },
      { status: 400 },
    );
  }

  const fromApi = await fetchDpdPickupPointsFromApi(country);
  const points = fromApi.length > 0 ? fromApi : getDpdPickupPoints(country);
  return NextResponse.json({ pickupPoints: points });
}
