const NOTION_API_URL = "https://api.notion.com/v1";
const NOTION_API_VERSION = "2026-03-11";
const NOTION_TIMEOUT_MS = 7_000;

type NotionConfig = {
  token: string;
  databaseId: string;
};

type NotionPropertySchema = {
  id: string;
  name: string;
  type: string;
};

type NotionDataSource = {
  id: string;
  properties: Record<string, NotionPropertySchema>;
};

type PreparedNotionDatabase = {
  dataSourceId: string;
  properties: Record<string, NotionPropertySchema>;
  addedProperties: string[];
};

type NotionPropertyValue = Record<string, unknown>;

type NotionPage = {
  id: string;
};

export type NotionReservationRow = Record<string, unknown> & {
  id?: unknown;
  payment_status?: unknown;
};

export type NotionSyncResult =
  | { status: "skipped"; reason: "not_configured" | "payment_not_confirmed" }
  | { status: "created" | "updated"; pageId: string };

const reservationStatuses = [
  "Nueva solicitud",
  "Pendiente de pago",
  "Depósito pagado",
  "Reserva confirmada",
  "Visita programada",
  "Medición realizada",
  "En procesamiento",
  "Pendiente de saldo",
  "Pagado por completo",
  "Entregado",
  "Pago caducado",
  "Cancelado",
  "Reprogramado"
];

const paymentStatuses = ["Pendiente", "Depósito pagado", "Pagado por completo"];

export const notionReservationSchema: Record<string, Record<string, unknown>> = {
  "ID reserva web": { rich_text: {} },
  Origen: {
    select: { options: [{ name: "Web DATUM", color: "blue" }] }
  },
  "Dirección inmueble": { rich_text: {} },
  "Fecha de visita": { date: {} },
  "Hora de visita": { rich_text: {} },
  "Servicio reservado": {
    select: {
      options: [
        { name: "Nube de Puntos 3D", color: "blue" },
        { name: "Planos 2D Estado Actual", color: "green" },
        { name: "Modelo 3D Revit", color: "purple" }
      ]
    }
  },
  "Superficie m²": { number: { format: "number" } },
  "Plantas inmueble": { number: { format: "number" } },
  "Detalle del servicio": { rich_text: {} },
  "Estado de reserva": {
    select: {
      options: reservationStatuses.map((name) => ({ name, color: statusColor(name) }))
    }
  },
  "Estado de pago": {
    select: {
      options: paymentStatuses.map((name) => ({ name, color: statusColor(name) }))
    }
  },
  "Base imponible": { number: { format: "euro" } },
  IVA: { number: { format: "euro" } },
  Total: { number: { format: "euro" } },
  "Depósito": { number: { format: "euro" } },
  "Saldo pendiente": { number: { format: "euro" } },
  "Notas cliente": { rich_text: {} },
  "Notas internas DATUM": { rich_text: {} },
  "Fecha de compra": { date: {} },
  "Acepta marketing": { checkbox: {} }
};

let preparedDatabasePromise: Promise<PreparedNotionDatabase> | null = null;

function statusColor(name: string) {
  if (/pagado|confirmada|entregado/i.test(name)) return "green";
  if (/cancelado|caducado/i.test(name)) return "red";
  if (/pendiente|procesamiento/i.test(name)) return "yellow";
  if (/reprogramado/i.test(name)) return "orange";
  return "blue";
}

function normalizePropertyName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function normalizeNotionId(value: string) {
  const compact = value.replaceAll("-", "").trim();
  if (!/^[0-9a-f]{32}$/i.test(compact)) return value.trim();
  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20)
  ].join("-");
}

function getNotionConfig(override?: Partial<NotionConfig>): NotionConfig | null {
  const token = override?.token ?? process.env.NOTION_TOKEN;
  const databaseId = override?.databaseId ?? process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) return null;
  return { token, databaseId: normalizeNotionId(databaseId) };
}

export function isNotionConfigured() {
  return Boolean(getNotionConfig());
}

async function notionRequest<T>(
  path: string,
  init: RequestInit,
  config: NotionConfig
): Promise<T> {
  const response = await fetch(`${NOTION_API_URL}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(NOTION_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
      ...init.headers
    }
  });

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; code?: string }
    | T
    | null;

  if (!response.ok) {
    const details =
      payload && typeof payload === "object" && "message" in payload
        ? payload.message
        : response.statusText;
    throw new Error(`Notion API (${response.status}): ${details ?? "error desconocido"}`);
  }

  return payload as T;
}

async function retrieveDataSource(dataSourceId: string, config: NotionConfig) {
  return notionRequest<NotionDataSource>(
    `/data_sources/${encodeURIComponent(dataSourceId)}`,
    { method: "GET" },
    config
  );
}

function findProperty(
  properties: Record<string, NotionPropertySchema>,
  candidates: string[]
) {
  const candidateNames = new Set(candidates.map(normalizePropertyName));
  return Object.values(properties).find((property) =>
    candidateNames.has(normalizePropertyName(property.name))
  );
}

export async function prepareNotionDatabase(
  override?: Partial<NotionConfig>
): Promise<PreparedNotionDatabase> {
  const config = getNotionConfig(override);
  if (!config) throw new Error("Faltan NOTION_TOKEN o NOTION_DATABASE_ID.");

  const database = await notionRequest<{ data_sources?: Array<{ id?: string }> }>(
    `/databases/${encodeURIComponent(config.databaseId)}`,
    { method: "GET" },
    config
  );
  const dataSourceId = database.data_sources?.find((item) => item.id)?.id;
  if (!dataSourceId) {
    throw new Error("La base de datos de Notion no contiene una fuente de datos accesible.");
  }

  let dataSource = await retrieveDataSource(dataSourceId, config);
  const additions = Object.fromEntries(
    Object.entries(notionReservationSchema).filter(([name]) =>
      !findProperty(dataSource.properties, [name])
    )
  );
  const addedProperties = Object.keys(additions);

  if (addedProperties.length) {
    await notionRequest<NotionDataSource>(
      `/data_sources/${encodeURIComponent(dataSourceId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ properties: additions })
      },
      config
    );
    dataSource = await retrieveDataSource(dataSourceId, config);
  }

  if (!Object.values(dataSource.properties).some((property) => property.type === "title")) {
    throw new Error("No se encontró la columna de título de la tabla de Notion.");
  }

  return {
    dataSourceId,
    properties: dataSource.properties,
    addedProperties
  };
}

async function getPreparedNotionDatabase() {
  if (!preparedDatabasePromise) {
    preparedDatabasePromise = prepareNotionDatabase().catch((error) => {
      preparedDatabasePromise = null;
      throw error;
    });
  }
  return preparedDatabasePromise;
}

function stringValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function richText(value: unknown, maxLength = 2_000) {
  const content = stringValue(value).trim().slice(0, maxLength);
  return content
    ? [{ type: "text", text: { content } }]
    : [];
}

function propertyValue(
  property: NotionPropertySchema,
  value: unknown
): NotionPropertyValue | null {
  switch (property.type) {
    case "title":
      return { title: richText(value) };
    case "rich_text":
      return { rich_text: richText(value) };
    case "email":
      return { email: stringValue(value).trim() || null };
    case "phone_number":
      return { phone_number: stringValue(value).trim() || null };
    case "number":
      return { number: numberValue(value) };
    case "select":
      return { select: stringValue(value).trim() ? { name: stringValue(value).trim().slice(0, 100) } : null };
    case "status":
      return { status: stringValue(value).trim() ? { name: stringValue(value).trim().slice(0, 100) } : null };
    case "date":
      return { date: stringValue(value).trim() ? { start: stringValue(value).trim() } : null };
    case "checkbox":
      return { checkbox: Boolean(value) };
    case "url":
      return { url: stringValue(value).trim() || null };
    default:
      return null;
  }
}

function setProperty(
  target: Record<string, NotionPropertyValue>,
  schema: Record<string, NotionPropertySchema>,
  candidates: string[],
  value: unknown
) {
  const property = findProperty(schema, candidates);
  if (!property) return;
  const mapped = propertyValue(property, value);
  if (mapped) target[property.id] = mapped;
}

function statusLabel(value: unknown) {
  const labels: Record<string, string> = {
    nueva_solicitud: "Nueva solicitud",
    pendiente_de_pago: "Pendiente de pago",
    deposito_pagado: "Depósito pagado",
    reserva_confirmada: "Reserva confirmada",
    visita_programada: "Visita programada",
    medicion_realizada: "Medición realizada",
    en_procesamiento: "En procesamiento",
    pendiente_de_saldo: "Pendiente de saldo",
    pagado_completo: "Pagado por completo",
    entregado: "Entregado",
    pago_caducado: "Pago caducado",
    cancelado: "Cancelado",
    reprogramado: "Reprogramado",
    pendiente: "Pendiente"
  };
  const key = stringValue(value);
  return labels[key] ?? key.replaceAll("_", " ");
}

function serviceLabel(value: unknown) {
  const labels: Record<string, string> = {
    point_cloud: "Nube de Puntos 3D",
    plans_2d: "Planos 2D Estado Actual",
    revit_3d: "Modelo 3D Revit"
  };
  return labels[stringValue(value)] ?? stringValue(value);
}

function serviceDetail(row: NotionReservationRow) {
  const parts = [
    stringValue(row.range_label),
    row.representation === "representacion_ortogonalizada"
      ? "Representación ortogonalizada"
      : "Geometría real"
  ];
  const additionalPlans = numberValue(row.additional_plans) ?? 0;
  const additionalSections = numberValue(row.additional_sections) ?? 0;
  const additionalElevations = numberValue(row.additional_elevations) ?? 0;
  if (additionalPlans) parts.push(`${additionalPlans} plano(s) adicional(es)`);
  if (additionalSections) parts.push(`${additionalSections} sección(es) adicional(es)`);
  if (additionalElevations) parts.push(`${additionalElevations} alzado(s) adicional(es)`);
  return parts.filter(Boolean).join(" · ");
}

export function buildNotionReservationProperties(
  row: NotionReservationRow,
  schema: Record<string, NotionPropertySchema>
) {
  const properties: Record<string, NotionPropertyValue> = {};
  const titleProperty = Object.values(schema).find((property) => property.type === "title");
  const title = [stringValue(row.full_address), stringValue(row.customer_name)]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" · ");

  if (titleProperty) {
    const mappedTitle = propertyValue(titleProperty, title || `Reserva ${stringValue(row.id)}`);
    if (mappedTitle) properties[titleProperty.id] = mappedTitle;
  }

  setProperty(properties, schema, ["ID reserva web"], row.id);
  setProperty(properties, schema, ["Origen"], "Web DATUM");
  setProperty(properties, schema, ["Dirección inmueble"], row.full_address);
  setProperty(properties, schema, ["Fecha de visita"], row.visit_date);
  setProperty(properties, schema, ["Hora de visita"], row.visit_time);
  setProperty(properties, schema, ["Servicio reservado"], serviceLabel(row.service_id));
  setProperty(properties, schema, ["Superficie m²"], row.surface);
  setProperty(properties, schema, ["Plantas inmueble"], row.property_floors);
  setProperty(properties, schema, ["Detalle del servicio"], serviceDetail(row));
  setProperty(properties, schema, ["Estado de reserva"], statusLabel(row.operational_status));
  setProperty(properties, schema, ["Estado de pago"], statusLabel(row.payment_status));
  setProperty(properties, schema, ["Base imponible"], row.taxable_base);
  setProperty(properties, schema, ["IVA"], row.vat);
  setProperty(properties, schema, ["Total"], row.total);
  setProperty(properties, schema, ["Depósito"], row.deposit);
  setProperty(properties, schema, ["Saldo pendiente"], row.pending_balance);
  setProperty(properties, schema, ["Notas cliente"], row.notes);
  setProperty(properties, schema, ["Notas internas DATUM"], row.internal_notes);
  setProperty(properties, schema, ["Fecha de compra"], row.created_at);
  setProperty(properties, schema, ["Acepta marketing"], row.accepts_marketing);

  // Aprovecha las columnas de contacto ya existentes en CRM DATUM sin modificar su tipo.
  setProperty(properties, schema, ["Nombre"], row.customer_name);
  setProperty(properties, schema, ["Teléfono", "Telefono"], row.phone);
  setProperty(properties, schema, ["Correo electrónico", "Correo electronico", "Email"], row.email);
  setProperty(properties, schema, ["Actuación", "Actuacion"], serviceLabel(row.service_id));

  return properties;
}

export function isReservationEligibleForNotion(row: NotionReservationRow) {
  return row.payment_status === "deposito_pagado" || row.payment_status === "pagado_completo";
}

export async function syncReservationToNotion(
  row: NotionReservationRow
): Promise<NotionSyncResult> {
  const config = getNotionConfig();
  if (!config) return { status: "skipped", reason: "not_configured" };
  if (!isReservationEligibleForNotion(row)) {
    return { status: "skipped", reason: "payment_not_confirmed" };
  }

  const prepared = await getPreparedNotionDatabase();
  const reservationIdProperty = findProperty(prepared.properties, ["ID reserva web"]);
  if (!reservationIdProperty) {
    throw new Error("No se encontró la columna ID reserva web en Notion.");
  }

  const query = await notionRequest<{ results?: NotionPage[] }>(
    `/data_sources/${encodeURIComponent(prepared.dataSourceId)}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: {
          property: reservationIdProperty.id,
          rich_text: { equals: stringValue(row.id) }
        },
        page_size: 1
      })
    },
    config
  );
  const properties = buildNotionReservationProperties(row, prepared.properties);
  const existingPage = query.results?.[0];

  if (existingPage?.id) {
    const updated = await notionRequest<NotionPage>(
      `/pages/${encodeURIComponent(existingPage.id)}`,
      { method: "PATCH", body: JSON.stringify({ properties }) },
      config
    );
    return { status: "updated", pageId: updated.id };
  }

  const created = await notionRequest<NotionPage>(
    "/pages",
    {
      method: "POST",
      body: JSON.stringify({
        parent: {
          type: "data_source_id",
          data_source_id: prepared.dataSourceId
        },
        properties
      })
    },
    config
  );
  return { status: "created", pageId: created.id };
}

export async function syncReservationToNotionSafely(
  row: NotionReservationRow,
  source: string
) {
  try {
    return await syncReservationToNotion(row);
  } catch (error) {
    console.error("No se pudo sincronizar la reserva con Notion", {
      reservationId: stringValue(row.id),
      source,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}
