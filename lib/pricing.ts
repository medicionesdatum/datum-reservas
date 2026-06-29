import type { Discount, ServiceId } from "@/lib/types";

export const VAT_RATE = 0.21;
export const DEPOSIT_RATE = 0.5;

export const services: Record<
  ServiceId,
  {
    name: string;
    shortName: string;
    description: string;
    includes: string[];
    delivery: string;
    from: number;
  }
> = {
  point_cloud: {
    name: "Nube de Puntos 3D",
    shortName: "Nube E57/RCP",
    description:
      "Captura con escáner láser 3D y entrega de nube de puntos universal para Revit y AutoCAD.",
    includes: ["E57 universal", "RCP Recap", "Sin planos ni modelo 3D"],
    delivery: "1-2 días hábiles",
    from: 200
  },
  plans_2d: {
    name: "Planos 2D Estado Actual",
    shortName: "Planos 2D + AutoCAD",
    description:
      "Nube de puntos, plantas acotadas, superficies por estancia, secciones y alzados.",
    includes: ["DXF/DWG editable", "PDF", "1 planta, 1 sección y 1 alzado"],
    delivery: "2-3 días hábiles",
    from: 350
  },
  revit_3d: {
    name: "Modelo 3D Revit",
    shortName: "Modelo 3D Revit",
    description:
      "Modelo BIM en Revit con elementos medidos, áreas y volúmenes a partir de una nube de puntos.",
    includes: ["RVT/IFC", "DXF/DWG + PDF", "Incluye 1 planta"],
    delivery: "3-5 días hábiles",
    from: 700
  }
};

export const priceRanges = [
  {
    min: 0,
    max: 50,
    label: "Hasta 50 m²",
    prices: { point_cloud: 200, plans_2d: 350, revit_3d: 700 },
    additional: 50
  },
  {
    min: 51,
    max: 100,
    label: "51-100 m²",
    prices: { point_cloud: 250, plans_2d: 400, revit_3d: 800 },
    additional: 50
  },
  {
    min: 101,
    max: 150,
    label: "101-150 m²",
    prices: { point_cloud: 325, plans_2d: 475, revit_3d: 950 },
    additional: 50
  },
  {
    min: 151,
    max: 200,
    label: "151-200 m²",
    prices: { point_cloud: 400, plans_2d: 550, revit_3d: 1100 },
    additional: 75
  },
  {
    min: 201,
    max: 300,
    label: "201-300 m²",
    prices: { point_cloud: 500, plans_2d: 650, revit_3d: 1300 },
    additional: 100
  },
  {
    min: 301,
    max: 400,
    label: "301-400 m²",
    prices: { point_cloud: 600, plans_2d: 750, revit_3d: 1500 },
    additional: 100
  }
] as const;

export const demoCoupons: Discount[] = [];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export function getPriceRange(surface: number) {
  if (!Number.isFinite(surface) || surface <= 0) return null;
  if (surface > 400) return null;
  return priceRanges.find((range) => surface >= range.min && surface <= range.max) ?? null;
}

export function resolveDiscount(code?: string) {
  if (!code) return null;
  return demoCoupons.find((coupon) => coupon.code.toUpperCase() === code.toUpperCase()) ?? null;
}

export function calculateQuote(params: {
  serviceId: ServiceId;
  surface: number;
  additionalPlans?: number;
  additionalSections?: number;
  additionalElevations?: number;
  couponCode?: string;
  discount?: Discount | null;
}) {
  const range = getPriceRange(params.surface);

  if (!range) {
    return {
      isCustomQuote: params.surface > 400,
      rangeLabel: params.surface > 400 ? "Más de 400 m²" : "",
      basePrice: 0,
      additionalUnitPrice: 0,
      additionalTotal: 0,
      discountAmount: 0,
      taxableBase: 0,
      vat: 0,
      total: 0,
      deposit: 0,
      pendingBalance: 0
    };
  }

  const additionalCount =
    Math.max(0, params.additionalPlans ?? 0) +
    Math.max(0, params.additionalSections ?? 0) +
    Math.max(0, params.additionalElevations ?? 0);
  const basePrice = range.prices[params.serviceId];
  const additionalTotal = additionalCount * range.additional;
  const subtotal = basePrice + additionalTotal;
  const discount = params.discount ?? resolveDiscount(params.couponCode);
  const discountAmount = discount
    ? discount.type === "percentage"
      ? subtotal * (discount.value / 100)
      : Math.min(subtotal, discount.value)
    : 0;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const vat = taxableBase * VAT_RATE;
  const total = taxableBase + vat;
  const deposit = total * DEPOSIT_RATE;

  return {
    isCustomQuote: false,
    rangeLabel: range.label,
    basePrice,
    additionalUnitPrice: range.additional,
    additionalTotal,
    discountAmount,
    taxableBase,
    vat,
    total,
    deposit,
    pendingBalance: total - deposit
  };
}
