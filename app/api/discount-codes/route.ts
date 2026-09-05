import { NextResponse } from "next/server";
import { findUsableDiscount } from "@/lib/discount-codes";
import { getPriceRange } from "@/lib/pricing";
import { consumeRateLimit } from "@/lib/rate-limit";
import type { ServiceId } from "@/lib/types";

const serviceIds = new Set<ServiceId>(["point_cloud", "plans_2d", "revit_3d"]);

export async function GET(request: Request) {
  const rateLimit = consumeRateLimit(request, {
    scope: "discount-code",
    limit: 60,
    windowMs: 60 * 1000
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos de descuento." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const serviceId = url.searchParams.get("serviceId") as ServiceId | null;
  const surface = Number(url.searchParams.get("surface") ?? 0);
  const additionalPlans = Number(url.searchParams.get("additionalPlans") ?? 0);
  const additionalSections = Number(url.searchParams.get("additionalSections") ?? 0);
  const additionalElevations = Number(url.searchParams.get("additionalElevations") ?? 0);
  const email = url.searchParams.get("email") ?? undefined;

  if (!code.trim() || code.length > 64 || !serviceId || !serviceIds.has(serviceId)) {
    return NextResponse.json({ discount: null });
  }

  if (
    ![additionalPlans, additionalSections, additionalElevations].every(
      (value) => Number.isInteger(value) && value >= 0 && value <= 20
    )
  ) {
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
