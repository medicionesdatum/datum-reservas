export type ServiceId = "point_cloud" | "plans_2d" | "revit_3d";

export type RepresentationType =
  | "geometria_real"
  | "representacion_ortogonalizada";

export type ReservationStatus =
  | "nueva_solicitud"
  | "pendiente_de_pago"
  | "deposito_pagado"
  | "reserva_confirmada"
  | "visita_programada"
  | "medicion_realizada"
  | "en_procesamiento"
  | "pendiente_de_saldo"
  | "pagado_completo"
  | "entregado"
  | "cancelado"
  | "reprogramado";

export type PaymentStatus = "pendiente" | "deposito_pagado" | "pagado_completo";

export type Discount = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
};

export type ReservationInput = {
  serviceId: ServiceId;
  surface: number;
  additionalPlans: number;
  additionalSections: number;
  additionalElevations: number;
  representation: RepresentationType;
  visitDate: string;
  visitTime: string;
  customerName: string;
  email: string;
  phone: string;
  fullAddress: string;
  street?: string;
  number?: string;
  floor?: string;
  postalCode: string;
  propertyFloors: number;
  notes?: string;
  couponCode?: string;
  acceptsTerms: boolean;
  acceptsMarketing: boolean;
};

export type ReservationRecord = ReservationInput & {
  id: string;
  createdAt: string;
  rangeLabel: string;
  basePrice: number;
  additionalUnitPrice: number;
  additionalTotal: number;
  discountAmount: number;
  taxableBase: number;
  vat: number;
  total: number;
  deposit: number;
  pendingBalance: number;
  operationalStatus: ReservationStatus;
  paymentStatus: PaymentStatus;
  depositPaymentLink?: string;
  depositSquareReference?: string;
  finalPaymentLink?: string;
  finalSquareReference?: string;
  internalNotes?: string;
};
