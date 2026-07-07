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
  const email = url.searchParams.get("email") ?? undefined;

  if (!code.trim() || !serviceId) {
    return NextResponse.json({ discount: null });
  }

  const range = getPriceRange(surface);
  if (!range || !range.prices[serviceId]) {
    return NextResponse.json({ discount: null });
  }

  const normalizedAdditionalPlans = serviceId === "point_cloud" ? 0 : additionalPlans;
  const normalizedAdditionalSections = serviceId === "plans_2d" ? additionalSections : 0;
  const normalizedAdditionalElevations = serviceId === "plans_2d" ? additionalElevations : 0;
  const additionalCount =
    Math.max(0, normalizedAdditionalPlans) +
    Math.max(0, normalizedAdditionalSections) +
    Math.max(0, normalizedAdditionalElevations);
  const subtotal = range.prices[serviceId] + additionalCount * range.additional;
  const discount = await findUsableDiscount(code, subtotal, email);

  return NextResponse.json({ discount });
}
