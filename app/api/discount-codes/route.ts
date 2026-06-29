import { NextResponse } from "next/server";
import { findUsableDiscount } from "@/lib/discount-codes";
import { getPriceRange } from "@/lib/pricing";
import type { ServiceId } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const serviceId = url.searchParams.get("serviceId") as ServiceId | null;
  const surface = Number(url.searchParams.get("surface") ?? 0);
  const additionalPlans = Number(url.searchParams.get("additionalPlans") ?? 0);
  const additionalSections = Number(url.searchParams.get("additionalSections") ?? 0);
  const additionalElevations = Number(url.searchParams.get("additionalElevations") ?? 0);

  if (!code.trim() || !serviceId) {
    return NextResponse.json({ discount: null });
  }

  const range = getPriceRange(surface);
  if (!range || !range.prices[serviceId]) {
    return NextResponse.json({ discount: null });
  }

  const additionalCount =
    Math.max(0, additionalPlans) +
    Math.max(0, additionalSections) +
    Math.max(0, additionalElevations);
  const subtotal = range.prices[serviceId] + additionalCount * range.additional;
  const discount = await findUsableDiscount(code, subtotal);

  return NextResponse.json({ discount });
}

