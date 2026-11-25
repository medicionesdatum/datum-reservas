import type { Discount, ServiceId } from "@/lib/types";

export const VAT_RATE = 0.21;
export const DEPOSIT_RATE = 0.5;

/** Superficie máxima (m²) con precio cerrado y reserva online. Por encima: presupuesto a medida. */
export const MAX_BOOKABLE_SURFACE = 1000;
export const MAX_BOOKABLE_SURFACE_LABEL = "1.000";

/**
 * Tarifa de cliente (Madrid ciudad, sin IVA). Única fuente de precios de la web:
 * asistente de reserva, importes de Square, /servicios y datos estructurados.
 * `facades` (Solo fachadas, por superficie equivalente) es una columna propia: no es un servicio
 * reservable y se puede cambiar sin afectar a `plans_floor`.
 */
export const priceRanges = [
  {
    min: 0,
    max: 50,
    label: "Hasta 50 m²",
    prices: { point_cloud: 175, plans_floor: 250, facades: 250, plans_2d: 350, revit_3d: 700 },
    additional: 50
  },
  {
    min: 51,
    max: 100,
    label: "51-100 m²",
    prices: { point_cloud: 225, plans_floor: 300, facades: 300, plans_2d: 400, revit_3d: 800 },
    additional: 50
  },
  {
    min: 101,
    max: 150,
    label: "101-150 m²",
    prices: { point_cloud: 275, plans_floor: 375, facades: 375, plans_2d: 475, revit_3d: 950 },
    additional: 75
  },
  {
    min: 151,
    max: 200,
    label: "151-200 m²",
    prices: { point_cloud: 325, plans_floor: 450, facades: 450, plans_2d: 550, revit_3d: 1100 },
    additional: 75
  },
  {
    min: 201,
    max: 300,
    label: "201-300 m²",
    prices: { point_cloud: 400, plans_floor: 550, facades: 550, plans_2d: 650, revit_3d: 1300 },
    additional: 100
  },
  {
    min: 301,
    max: 400,
    label: "301-400 m²",
    prices: { point_cloud: 475, plans_floor: 650, facades: 650, plans_2d: 750, revit_3d: 1500 },
    additional: 100
  },
  {
    min: 401,
    max: 500,
    label: "401-500 m²",
    prices: { point_cloud: 525, plans_floor: 725, facades: 725, plans_2d: 825, revit_3d: 1650 },
    additional: 100
  },
  {
    min: 501,
    max: 600,
    label: "501-600 m²",
    prices: { point_cloud: 575, plans_floor: 800, facades: 800, plans_2d: 900, revit_3d: 1800 },
    additional: 100
  },
  {
    min: 601,
    max: 700,
    label: "601-700 m²",
    prices: { point_cloud: 625, plans_floor: 875, facades: 875, plans_2d: 975, revit_3d: 1950 },
    additional: 100
  },
  {
    min: 701,
    max: 800,
    label: "701-800 m²",
    prices: { point_cloud: 675, plans_floor: 950, facades: 950, plans_2d: 1050, revit_3d: 2100 },
    additional: 100
  },
  {
    min: 801,
    max: 900,
    label: "801-900 m²",
    prices: { point_cloud: 725, plans_floor: 1025, facades: 1025, plans_2d: 1125, revit_3d: 2250 },
    additional: 100
  },
  {
    min: 901,
    max: 1000,
    label: "901-1.000 m²",
    prices: { point_cloud: 775, plans_floor: 1100, facades: 1100, plans_2d: 1200, revit_3d: 2400 },
    additional: 100
  }
] as const;

const firstRange = priceRanges[0].prices;

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
      "Nube de puntos sin procesar en formato E57 universal y RCP Recap, compatible con Revit y AutoCAD. Ideal si tu estudio modela internamente.",
    includes: ["E57 universal", "RCP Recap", "No incluye planos 2D o 3D"],
    delivery: "1-2 días hábiles",
    from: firstRange.point_cloud
  },
  plans_floor: {
    name: "Planos 2D solo planta",
    shortName: "Planos 2D solo planta",
    description:
      "Servicio nube de puntos E57 y RCP y planta acotada con superficies por estancia. No incluye secciones ni alzados.",
    includes: ["DXF/DWG editable + PDF", "Incluye 1 planta", "No incluye sección ni alzado"],
    delivery: "2-3 días hábiles",
    from: firstRange.plans_floor
  },
  plans_2d: {
    name: "Planos 2D Estado Actual",
    shortName: "Planos 2D + AutoCAD",
    description:
      "Servicio nube de puntos E57 y RCP, plantas acotadas con superficies por estancia, secciones y alzados.",
    includes: ["DXF/DWG editable + PDF", "Incluye 1 planta", "Incluye 1 sección y 1 alzado de fachada"],
    delivery: "2-3 días hábiles",
    from: firstRange.plans_2d
  },
  revit_3d: {
    name: "Modelo 3D Revit",
    shortName: "Modelo 3D Revit",
    description:
      "Servicio premium: nube de puntos E57 y RCP, modelo 3D en Revit con elementos medidos, áreas y volúmenes.",
    includes: ["RVT/IFC", "DXF/DWG + PDF", "Incluye 1 planta"],
    delivery: "3-5 días hábiles",
    from: firstRange.revit_3d
  }
};

export const demoCoupons: Discount[] = [];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    useGrouping: "always"
  }).format(value);
}

export function getPriceRange(surface: number) {
  if (!Number.isFinite(surface) || surface <= 0) return null;
  if (surface > MAX_BOOKABLE_SURFACE) return null;
  return priceRanges.find((range) => surface <= range.max) ?? null;
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
      isCustomQuote: params.surface > MAX_BOOKABLE_SURFACE,
      rangeLabel: params.surface > MAX_BOOKABLE_SURFACE ? `Más de ${MAX_BOOKABLE_SURFACE_LABEL} m²` : "",
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

  const additionalPlans = params.serviceId === "point_cloud" ? 0 : params.additionalPlans;
  const additionalSections = params.serviceId === "plans_2d" ? params.additionalSections : 0;
  const additionalElevations = params.serviceId === "plans_2d" ? params.additionalElevations : 0;
  const additionalCount =
    Math.max(0, additionalPlans ?? 0) +
    Math.max(0, additionalSections ?? 0) +
    Math.max(0, additionalElevations ?? 0);
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
