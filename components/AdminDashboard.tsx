"use client";

import { useMemo, useState } from "react";
import { formatCurrency, services } from "@/lib/pricing";
import { getAllowedSlots } from "@/lib/availability";

type ReservationRow = {
  id: string;
  created_at: string;
  customer_name: string;
  email: string;
  phone: string;
  full_address: string;
  postal_code: string;
  service_id: keyof typeof services;
  surface: number;
  range_label: string;
  additional_plans: number;
  additional_sections: number;
  additional_elevations: number;
  representation: string;
  visit_date: string;
  visit_time: string;
  taxable_base: number;
  vat: number;
  total: number;
  deposit: number;
  pending_balance: number;
  payment_status: string;
  operational_status: string;
  deposit_payment_link?: string;
  final_payment_link?: string;
  notes?: string;
  internal_notes?: string;
};

type BlockedSlot = {
  id: string;
  visit_date: string;
  visit_time: string;
  reason?: string;
  created_at?: string;
};

type DiscountCode = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  active: boolean;
  expires_at?: string | null;
  max_uses?: number | null;
  times_used: number;
  one_per_email?: boolean | null;
  min_taxable_base: number;
  created_at?: string;
};

type AdminView = "resumen" | "calendario" | "reservas" | "clientes" | "descuentos";

const statuses = [
  "nueva_solicitud", "pendiente_de_pago", "deposito_pagado", "reserva_confirmada",
  "visita_programada", "medicion_realizada", "en_procesamiento", "pendiente_de_saldo",
  "pagado_completo", "entregado", "cancelado", "reprogramado"
];

const statusLabels: Record<string, string> = {
  nueva_solicitud: "Nueva solicitud", pendiente_de_pago: "Pendiente de pago",
  deposito_pagado: "Depósito pagado", reserva_confirmada: "Reserva confirmada",
  visita_programada: "Visita programada", medicion_realizada: "Medición realizada",
  en_procesamiento: "En procesamiento", pendiente_de_saldo: "Pendiente de saldo",
  pagado_completo: "Pagado por completo", entregado: "Entregado", cancelado: "Cancelado",
  reprogramado: "Reprogramado", pendiente: "Pendiente"
};

const viewLabels: { id: AdminView; label: string; short: string }[] = [
  { id: "resumen", label: "Resumen", short: "R" },
  { id: "calendario", label: "Calendario", short: "C" },
  { id: "reservas", label: "Reservas", short: "A" },
  { id: "clientes", label: "Clientes", short: "P" },
  { id: "descuentos", label: "Descuentos", short: "%" }
];

function formatStatus(status: string) {
  return statusLabels[status] ?? status.replaceAll("_", " ");
}

function todayValue() {
  return toDateValue(new Date());
}

export default function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [view, setView] = useState<AdminView>("resumen");
  const [selectedId, setSelectedId] = useState("");

  async function loadDashboard() {
    setIsLoading(true);
    setMessage("");
    const headers = { "x-admin-email": email, "x-admin-password": password };
    const [reservationResponse, blockResponse, discountResponse] = await Promise.all([
      fetch("/api/admin/reservations", { headers }),
      fetch("/api/admin/blocked-slots", { headers }),
      fetch("/api/admin/discount-codes", { headers })
    ]);
    const reservationPayload = await reservationResponse.json();
    const blockPayload = await blockResponse.json();
    const discountPayload = await discountResponse.json();
    setIsLoading(false);

    if (!reservationResponse.ok || !blockResponse.ok || !discountResponse.ok) {
      setMessage(reservationPayload.error ?? blockPayload.error ?? discountPayload.error ?? "No se pudo acceder al panel.");
      return;
    }

    setReservations(reservationPayload.reservations ?? []);
    setBlockedSlots(blockPayload.blockedSlots ?? []);
    setDiscountCodes(discountPayload.discountCodes ?? []);
    setSelectedId(reservationPayload.reservations?.[0]?.id ?? "");
    setIsLoaded(true);
    if (reservationPayload.demo) {
      setMessage("Modo de demostración: conecta Supabase para guardar reservas y bloqueos reales.");
    }
  }

  async function updateReservation(update: Partial<ReservationRow>) {
    const selected = reservations.find((reservation) => reservation.id === selectedId);
    if (!selected) return;
    const next = { ...selected, ...update };
    setReservations((current) => current.map((item) => item.id === next.id ? next : item));
    const response = await fetch("/api/admin/reservations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-email": email, "x-admin-password": password },
      body: JSON.stringify({
        id: next.id,
        operationalStatus: next.operational_status,
        paymentStatus: next.payment_status,
        internalNotes: next.internal_notes
      })
    });
    setMessage(response.ok ? "Cambios guardados." : "No se pudieron guardar los cambios.");
  }

  async function addBlock(visitDate: string, visitTime: string, reason: string) {
    const response = await fetch("/api/admin/blocked-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-email": email, "x-admin-password": password },
      body: JSON.stringify({ visitDate, visitTime, reason })
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo bloquear el horario.");
      return false;
    }
    setBlockedSlots((current) => [...current, payload.blockedSlot]);
    setMessage("Horario bloqueado correctamente.");
    return true;
  }

  async function removeBlock(id: string) {
    const response = await fetch(`/api/admin/blocked-slots?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-email": email, "x-admin-password": password }
    });
    if (!response.ok) {
      setMessage("No se pudo liberar el horario.");
      return;
    }
    setBlockedSlots((current) => current.filter((slot) => slot.id !== id));
    setMessage("Horario disponible de nuevo.");
  }

  async function createDiscountCode(input: {
    code: string;
    type: "percentage" | "fixed";
    value: number;
    expiresAt?: string;
    maxUses?: number;
    onePerEmail?: boolean;
    minTaxableBase?: number;
  }) {
    const response = await fetch("/api/admin/discount-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-email": email, "x-admin-password": password },
      body: JSON.stringify(input)
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo crear el código.");
      return false;
    }
    setDiscountCodes((current) => [payload.discountCode, ...current]);
    setMessage("Código de descuento creado.");
    return true;
  }

  async function updateDiscountCode(id: string, update: Partial<DiscountCode>) {
    const response = await fetch("/api/admin/discount-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-email": email, "x-admin-password": password },
      body: JSON.stringify({ id, ...update })
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo actualizar el código.");
      return;
    }
    setDiscountCodes((current) => current.map((item) => item.id === id ? payload.discountCode : item));
    setMessage("Código actualizado.");
  }

  async function deleteDiscountCode(id: string) {
    const response = await fetch(`/api/admin/discount-codes?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-email": email, "x-admin-password": password }
    });
    if (!response.ok) {
      setMessage("No se pudo eliminar el código.");
      return;
    }
    setDiscountCodes((current) => current.filter((item) => item.id !== id));
    setMessage("Código eliminado.");
  }

  if (!isLoaded) {
    return <AdminLogin email={email} password={password} message={message} isLoading={isLoading} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={loadDashboard} />;
  }

  return (
    <div className="min-h-screen bg-[#07111e] text-white lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="border-b border-datum-line bg-[#091827] lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block lg:px-6 lg:py-7">
          <div>
            <p className="text-xl font-semibold tracking-[0.12em]">DATUM<span className="text-datum-cyan">.</span></p>
            <p className="mt-1 text-xs text-slate-400">Centro de operaciones</p>
          </div>
          <a className="text-xs text-slate-400 hover:text-datum-cyan lg:mt-8 lg:block" href="/">Ver reservas públicas</a>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1 lg:px-4">
          {viewLabels.map((item) => (
            <button
              className={`flex min-w-max items-center gap-3 rounded px-4 py-3 text-sm transition lg:w-full ${view === item.id ? "bg-datum-cyan text-datum-ink" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
              key={item.id}
              onClick={() => setView(item.id)}
              type="button"
            >
              <span className="flex size-6 items-center justify-center rounded border border-current/30 text-[10px] font-bold">{item.short}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 px-4 py-6 md:px-8 lg:px-10 lg:py-8">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-datum-cyan">Administración</p>
            <h1 className="mt-2 text-3xl font-semibold">{viewLabels.find((item) => item.id === view)?.label}</h1>
          </div>
          <p className="text-sm capitalize text-slate-400">{new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}</p>
        </header>

        {message ? <div className="mb-6 flex items-center justify-between gap-3 rounded border border-datum-line bg-datum-panel px-4 py-3 text-sm text-slate-200"><span>{message}</span><button aria-label="Cerrar mensaje" className="text-slate-400 hover:text-white" onClick={() => setMessage("")} type="button">×</button></div> : null}

        {view === "resumen" ? <Overview reservations={reservations} blockedSlots={blockedSlots} onOpenCalendar={() => setView("calendario")} /> : null}
        {view === "calendario" ? <AdminCalendar reservations={reservations} blockedSlots={blockedSlots} onAddBlock={addBlock} onRemoveBlock={removeBlock} /> : null}
        {view === "reservas" ? <ReservationsView reservations={reservations} selectedId={selectedId} onSelect={setSelectedId} onUpdate={updateReservation} email={email} password={password} setMessage={setMessage} /> : null}
        {view === "clientes" ? <ClientsView reservations={reservations} onOpenReservation={(id) => { setSelectedId(id); setView("reservas"); }} /> : null}
        {view === "descuentos" ? <DiscountCodesView discountCodes={discountCodes} onCreate={createDiscountCode} onUpdate={updateDiscountCode} onDelete={deleteDiscountCode} /> : null}
      </main>
    </div>
  );
}

function AdminLogin({ email, password, message, isLoading, onEmailChange, onPasswordChange, onSubmit }: { email: string; password: string; message: string; isLoading: boolean; onEmailChange: (value: string) => void; onPasswordChange: (value: string) => void; onSubmit: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="w-full max-w-sm">
        <p className="text-2xl font-semibold tracking-[0.12em]">DATUM<span className="text-datum-cyan">.</span></p>
        <p className="mt-2 text-sm text-slate-400">Centro de operaciones</p>
        <h1 className="mt-10 text-3xl font-semibold">Acceso administrativo</h1>
        <label className="mt-7 block">
          <span className="text-sm text-slate-300">Correo electrónico</span>
          <input autoComplete="username" className="focus-ring mt-2 w-full rounded border border-datum-line bg-white px-4 py-3" onChange={(event) => onEmailChange(event.target.value)} type="email" value={email} />
        </label>
        <label className="mt-4 block">
          <span className="text-sm text-slate-300">Clave de administración</span>
          <input autoComplete="current-password" className="focus-ring mt-2 w-full rounded border border-datum-line bg-white px-4 py-3" onChange={(event) => onPasswordChange(event.target.value)} onKeyDown={(event) => event.key === "Enter" && onSubmit()} type="password" value={password} />
        </label>
        <button className="mt-4 w-full rounded bg-datum-cyan px-5 py-3 font-semibold text-datum-ink disabled:opacity-50" disabled={isLoading} onClick={onSubmit} type="button">{isLoading ? "Cargando..." : "Entrar"}</button>
        {message ? <p className="mt-4 text-sm text-red-200">{message}</p> : null}
      </section>
    </main>
  );
}

function Overview({ reservations, blockedSlots, onOpenCalendar }: { reservations: ReservationRow[]; blockedSlots: BlockedSlot[]; onOpenCalendar: () => void }) {
  const today = todayValue();
  const active = reservations.filter((item) => !["cancelado", "reprogramado"].includes(item.operational_status));
  const todayAppointments = active.filter((item) => item.visit_date === today);
  const upcoming = active.filter((item) => item.visit_date >= today).sort(sortByVisit).slice(0, 6);
  const revenue = reservations.filter((item) => item.payment_status === "pagado_completo").reduce((sum, item) => sum + Number(item.total), 0);
  const deposits = reservations.filter((item) => ["deposito_pagado", "pagado_completo"].includes(item.payment_status)).reduce((sum, item) => sum + Number(item.deposit), 0);
  const pending = reservations.filter((item) => item.payment_status === "pendiente").length;
  const conversion = reservations.length ? Math.round((active.filter((item) => item.payment_status !== "pendiente").length / reservations.length) * 100) : 0;

  return (
    <div className="space-y-7">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Citas de hoy" value={String(todayAppointments.length)} hint={`${upcoming.length} próximas`} />
        <Metric label="Reservas totales" value={String(reservations.length)} hint={`${active.length} activas`} />
        <Metric label="Depósitos cobrados" value={formatCurrency(deposits)} hint={`${pending} pendientes`} />
        <Metric label="Ingresos completados" value={formatCurrency(revenue)} hint="Pagos completos" />
        <Metric label="Confirmación" value={`${conversion}%`} hint="Reservas con pago" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="border-t border-datum-line pt-5">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Próximas citas</h2><button className="text-sm text-datum-cyan" onClick={onOpenCalendar} type="button">Abrir calendario</button></div>
          <div className="mt-4 divide-y divide-datum-line">
            {upcoming.map((item) => <AppointmentRow key={item.id} reservation={item} />)}
            {!upcoming.length ? <Empty text="Todavía no hay citas próximas." /> : null}
          </div>
        </div>
        <div className="border-t border-datum-line pt-5">
          <h2 className="text-lg font-semibold">Actividad operativa</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <DataLine label="Horarios bloqueados" value={String(blockedSlots.filter((item) => item.visit_date >= today).length)} />
            <DataLine label="Saldos pendientes" value={formatCurrency(reservations.reduce((sum, item) => item.payment_status === "pagado_completo" ? sum : sum + Number(item.pending_balance), 0))} />
            <DataLine label="Mediciones realizadas" value={String(reservations.filter((item) => ["medicion_realizada", "en_procesamiento", "entregado"].includes(item.operational_status)).length)} />
            <DataLine label="Trabajos entregados" value={String(reservations.filter((item) => item.operational_status === "entregado").length)} />
          </dl>
        </div>
      </section>
    </div>
  );
}

function AdminCalendar({ reservations, blockedSlots, onAddBlock, onRemoveBlock }: { reservations: ReservationRow[]; blockedSlots: BlockedSlot[]; onAddBlock: (date: string, time: string, reason: string) => Promise<boolean>; onRemoveBlock: (id: string) => void }) {
  const [selectedDate, setSelectedDate] = useState(todayValue());
  const initial = new Date(`${selectedDate}T12:00:00`);
  const [month, setMonth] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));
  const days = getCalendarDays(month);
  const dayReservations = reservations.filter((item) => item.visit_date === selectedDate && !["cancelado", "reprogramado"].includes(item.operational_status)).sort(sortByVisit);
  const dayBlocks = blockedSlots.filter((item) => item.visit_date === selectedDate).sort((a, b) => a.visit_time.localeCompare(b.visit_time));
  const monthLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(month);
  const slots = getAllowedSlots(selectedDate);

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <div className="flex items-center justify-between gap-4 border-b border-datum-line pb-4">
          <button aria-label="Mes anterior" className="calendar-arrow" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} type="button">‹</button>
          <h2 className="font-semibold capitalize">{monthLabel}</h2>
          <button aria-label="Mes siguiente" className="calendar-arrow" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} type="button">›</button>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded border border-datum-line bg-datum-line">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((label) => <div className="bg-[#0a1726] py-3 text-center text-xs font-semibold text-slate-400" key={label}>{label}</div>)}
          {days.map((day) => {
            const value = toDateValue(day);
            const current = day.getMonth() === month.getMonth();
            const appointments = reservations.filter((item) => item.visit_date === value && !["cancelado", "reprogramado"].includes(item.operational_status)).length;
            const blocks = blockedSlots.filter((item) => item.visit_date === value).length;
            return (
              <button className={`min-h-24 bg-[#0b1929] p-2 text-left transition hover:bg-[#10243a] ${selectedDate === value ? "ring-2 ring-inset ring-datum-cyan" : ""} ${current ? "" : "opacity-35"}`} key={value} onClick={() => setSelectedDate(value)} type="button">
                <span className={`flex size-7 items-center justify-center rounded text-sm ${value === todayValue() ? "bg-datum-cyan font-bold text-datum-ink" : "text-slate-300"}`}>{day.getDate()}</span>
                {appointments ? <span className="mt-2 block rounded bg-cyan-400/15 px-2 py-1 text-xs text-cyan-200">{appointments} {appointments === 1 ? "cita" : "citas"}</span> : null}
                {blocks ? <span className="mt-1 block rounded bg-rose-400/10 px-2 py-1 text-xs text-rose-200">{blocks} {blocks === 1 ? "bloqueo" : "bloqueos"}</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <aside className="border-t border-datum-line pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-datum-cyan">Agenda del día</p>
        <h2 className="mt-2 text-xl font-semibold capitalize">{formatLongDate(selectedDate)}</h2>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
          <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-datum-cyan" />Reserva</span>
          <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-rose-300" />Bloqueo</span>
          <span className="flex items-center gap-2"><i className="size-2 rounded-full border border-slate-500" />Libre</span>
        </div>

        {slots.length ? (
          <div className="mt-5 overflow-hidden rounded border border-datum-line">
            {slots.map((slot) => {
              const reservation = dayReservations.find((item) => item.visit_time === slot);
              const blocked = dayBlocks.find((item) => item.visit_time === slot);

              if (reservation) {
                return (
                  <div className="grid min-h-20 grid-cols-[64px_1fr] border-b border-datum-line bg-datum-cyan/10 last:border-b-0" key={slot}>
                    <time className="border-r border-datum-line px-3 py-4 text-sm font-semibold text-datum-cyan">{slot}</time>
                    <div className="px-4 py-3">
                      <p className="font-semibold text-white">{reservation.customer_name}</p>
                      <p className="mt-1 text-xs text-slate-400">{services[reservation.service_id]?.shortName} · {reservation.full_address}</p>
                    </div>
                  </div>
                );
              }

              if (blocked) {
                return (
                  <div className="grid min-h-20 grid-cols-[64px_1fr] border-b border-datum-line bg-rose-400/10 last:border-b-0" key={slot}>
                    <time className="border-r border-datum-line px-3 py-4 text-sm font-semibold text-rose-200">{slot}</time>
                    <div className="flex items-start justify-between gap-3 px-4 py-3">
                      <div><p className="font-semibold text-rose-100">Bloqueado</p><p className="mt-1 text-xs text-slate-400">{blocked.reason || "No disponible"}</p></div>
                      <button className="text-xs font-semibold text-rose-200 hover:text-white" onClick={() => onRemoveBlock(blocked.id)} type="button">Liberar</button>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  aria-label={`Bloquear ${slot}`}
                  className="grid min-h-20 w-full grid-cols-[64px_1fr] border-b border-datum-line bg-white/[0.015] text-left transition last:border-b-0 hover:bg-white/[0.06]"
                  key={slot}
                  onClick={() => onAddBlock(selectedDate, slot, "Bloqueado por administración")}
                  type="button"
                >
                  <time className="h-full border-r border-datum-line px-3 py-4 text-sm font-semibold text-slate-300">{slot}</time>
                  <span className="px-4 py-4 text-sm text-slate-500">Libre · Pulsar para bloquear</span>
                </button>
              );
            })}
          </div>
        ) : <p className="mt-6 rounded border border-datum-line py-8 text-center text-sm text-slate-500">Este día no tiene horario de atención.</p>}
      </aside>
    </div>
  );
}

function ReservationsView({ reservations, selectedId, onSelect, onUpdate, email, password, setMessage }: { reservations: ReservationRow[]; selectedId: string; onSelect: (id: string) => void; onUpdate: (update: Partial<ReservationRow>) => void; email: string; password: string; setMessage: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");
  const filtered = reservations.filter((item) => (filter === "todos" || item.operational_status === filter) && `${item.customer_name} ${item.email} ${item.phone}`.toLowerCase().includes(query.toLowerCase()));
  const selected = reservations.find((item) => item.id === selectedId) ?? filtered[0];

  async function generateFinalPayment() {
    if (!selected) return;
    const response = await fetch("/api/admin/final-payment", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-email": email, "x-admin-password": password }, body: JSON.stringify({ id: selected.id, pendingBalance: selected.pending_balance }) });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error ?? "No se pudo generar el enlace.");
    onUpdate({ final_payment_link: payload.checkoutUrl, operational_status: "pendiente_de_saldo" });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <input className="rounded border border-datum-line bg-white px-3 py-3 text-sm" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, email o teléfono" value={query} />
          <select className="rounded border border-datum-line bg-white px-3 py-3 text-sm" onChange={(event) => setFilter(event.target.value)} value={filter}><option value="todos">Todos los estados</option>{statuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</select>
        </div>
        <div className="mt-4 max-h-[65vh] space-y-2 overflow-y-auto pr-1">
          {filtered.map((item) => <button className={`w-full rounded border p-4 text-left ${selected?.id === item.id ? "border-datum-cyan bg-datum-cyan/10" : "border-datum-line bg-white/[0.03] hover:border-slate-500"}`} key={item.id} onClick={() => onSelect(item.id)} type="button"><div className="flex items-start justify-between gap-2"><p className="font-semibold">{item.customer_name}</p><span className="text-xs text-datum-cyan">{item.visit_time}</span></div><p className="mt-1 text-sm text-slate-400">{formatShortDate(item.visit_date)} · {services[item.service_id]?.shortName}</p><p className="mt-3 text-xs text-slate-500">{formatStatus(item.operational_status)}</p></button>)}
          {!filtered.length ? <Empty text="No hay reservas con estos filtros." /> : null}
        </div>
      </aside>
      <section className="min-w-0 border-t border-datum-line pt-6 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
        {selected ? <ReservationDetail reservation={selected} onUpdate={onUpdate} onFinalPayment={generateFinalPayment} /> : <Empty text="Selecciona una reserva para ver sus detalles." />}
      </section>
    </div>
  );
}

function ReservationDetail({ reservation, onUpdate, onFinalPayment }: { reservation: ReservationRow; onUpdate: (update: Partial<ReservationRow>) => void; onFinalPayment: () => void }) {
  const additionalCount = reservation.additional_plans + reservation.additional_sections + reservation.additional_elevations;
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs text-datum-cyan">{reservation.id}</p><h2 className="mt-2 text-2xl font-semibold">{reservation.customer_name}</h2><p className="mt-2 text-sm text-slate-400">{reservation.email} · {reservation.phone}</p></div><button className="rounded bg-datum-cyan px-4 py-3 text-sm font-semibold text-datum-ink" onClick={onFinalPayment} type="button">Generar saldo en Square</button></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Info label="Servicio" value={services[reservation.service_id]?.name ?? reservation.service_id} />
        <Info label="Visita" value={`${formatShortDate(reservation.visit_date)} · ${reservation.visit_time}`} />
        <Info label="Superficie" value={`${reservation.surface} m² · ${reservation.range_label}`} />
        <Info label="Adicionales" value={String(additionalCount)} />
        <Info label="Representación" value={reservation.representation === "geometria_real" ? "Geometría real" : "Representación ortogonalizada"} />
        <Info label="Dirección" value={`${reservation.full_address}, ${reservation.postal_code}`} />
        <Info label="Total" value={formatCurrency(reservation.total)} />
        <Info label="Depósito" value={formatCurrency(reservation.deposit)} />
        <Info label="Saldo pendiente" value={formatCurrency(reservation.pending_balance)} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label><span className="text-sm text-slate-300">Estado operativo</span><select className="mt-2 w-full rounded border border-datum-line bg-white px-3 py-3" onChange={(event) => onUpdate({ operational_status: event.target.value })} value={reservation.operational_status}>{statuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</select></label>
        <label><span className="text-sm text-slate-300">Estado de pago</span><select className="mt-2 w-full rounded border border-datum-line bg-white px-3 py-3" onChange={(event) => onUpdate({ payment_status: event.target.value })} value={reservation.payment_status}><option value="pendiente">Pendiente</option><option value="deposito_pagado">Depósito pagado</option><option value="pagado_completo">Pagado por completo</option></select></label>
      </div>
      <label className="mt-5 block"><span className="text-sm text-slate-300">Notas internas</span><textarea className="mt-2 min-h-28 w-full rounded border border-datum-line bg-white px-3 py-3" defaultValue={reservation.internal_notes} onBlur={(event) => onUpdate({ internal_notes: event.target.value })} /></label>
      <div className="mt-5 flex flex-wrap gap-3 text-sm">{reservation.deposit_payment_link ? <a className="rounded border border-datum-line px-4 py-3 text-datum-cyan" href={reservation.deposit_payment_link} rel="noreferrer" target="_blank">Abrir enlace del depósito</a> : null}{reservation.final_payment_link ? <a className="rounded border border-datum-line px-4 py-3 text-datum-cyan" href={reservation.final_payment_link} rel="noreferrer" target="_blank">Abrir enlace del saldo</a> : null}</div>
    </div>
  );
}

function ClientsView({ reservations, onOpenReservation }: { reservations: ReservationRow[]; onOpenReservation: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const clients = useMemo(() => {
    const groups = new Map<string, ReservationRow[]>();
    reservations.forEach((item) => { const key = item.email.toLowerCase(); groups.set(key, [...(groups.get(key) ?? []), item]); });
    return Array.from(groups.values()).map((items) => ({ latest: [...items].sort((a, b) => b.created_at.localeCompare(a.created_at))[0], items, total: items.reduce((sum, item) => sum + Number(item.total), 0) })).sort((a, b) => b.latest.created_at.localeCompare(a.latest.created_at));
  }, [reservations]);
  const filtered = clients.filter((client) => `${client.latest.customer_name} ${client.latest.email} ${client.latest.phone}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-slate-400">{clients.length} clientes únicos · {reservations.length} reservas</p></div><input className="w-full rounded border border-datum-line bg-white px-3 py-3 text-sm sm:w-80" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente" value={query} /></div>
      <div className="mt-6 overflow-x-auto border-t border-datum-line">
        <table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="py-4 pr-4">Cliente</th><th className="px-4 py-4">Contacto</th><th className="px-4 py-4">Reservas</th><th className="px-4 py-4">Facturación</th><th className="px-4 py-4">Última reserva</th><th className="py-4 pl-4"></th></tr></thead><tbody className="divide-y divide-datum-line">{filtered.map((client) => <tr key={client.latest.email}><td className="py-4 pr-4 font-semibold">{client.latest.customer_name}</td><td className="px-4 py-4 text-slate-400"><span className="block">{client.latest.email}</span><span>{client.latest.phone}</span></td><td className="px-4 py-4">{client.items.length}</td><td className="px-4 py-4">{formatCurrency(client.total)}</td><td className="px-4 py-4 text-slate-400">{formatShortDate(client.latest.visit_date)}</td><td className="py-4 pl-4 text-right"><button className="text-datum-cyan" onClick={() => onOpenReservation(client.latest.id)} type="button">Ver ficha</button></td></tr>)}</tbody></table>
        {!filtered.length ? <Empty text="No hay clientes que coincidan con la búsqueda." /> : null}
      </div>
    </div>
  );
}

function DiscountCodesView({
  discountCodes,
  onCreate,
  onUpdate,
  onDelete
}: {
  discountCodes: DiscountCode[];
  onCreate: (input: { code: string; type: "percentage" | "fixed"; value: number; expiresAt?: string; maxUses?: number; onePerEmail?: boolean; minTaxableBase?: number }) => Promise<boolean>;
  onUpdate: (id: string, update: Partial<DiscountCode>) => void;
  onDelete: (id: string) => void;
}) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [onePerEmail, setOnePerEmail] = useState(false);
  const [minTaxableBase, setMinTaxableBase] = useState("");

  async function submit() {
    const created = await onCreate({
      code,
      type,
      value: Number(value),
      expiresAt,
      maxUses: maxUses ? Number(maxUses) : undefined,
      onePerEmail,
      minTaxableBase: minTaxableBase ? Number(minTaxableBase) : undefined
    });

    if (created) {
      setCode("");
      setType("percentage");
      setValue("");
      setExpiresAt("");
      setMaxUses("");
      setOnePerEmail(false);
      setMinTaxableBase("");
    }
  }

  return (
    <div className="grid gap-7 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="border-t border-datum-line pt-5">
        <h2 className="text-lg font-semibold">Nuevo código</h2>
        <div className="mt-5 space-y-4">
          <label className="block"><span className="text-sm text-slate-300">Código</span><input className="mt-2 w-full rounded border border-datum-line bg-white px-3 py-3 uppercase" onChange={(event) => setCode(event.target.value)} placeholder="DATUM10" value={code} /></label>
          <label className="block"><span className="text-sm text-slate-300">Tipo</span><select className="mt-2 w-full rounded border border-datum-line bg-white px-3 py-3" onChange={(event) => setType(event.target.value as "percentage" | "fixed")} value={type}><option value="percentage">Porcentaje</option><option value="fixed">Importe fijo</option></select></label>
          <label className="block"><span className="text-sm text-slate-300">Valor</span><input className="mt-2 w-full rounded border border-datum-line bg-white px-3 py-3" min="0" onChange={(event) => setValue(event.target.value)} placeholder={type === "percentage" ? "10" : "50"} type="number" value={value} /></label>
          <label className="block"><span className="text-sm text-slate-300">Válido hasta</span><input className="mt-2 w-full rounded border border-datum-line bg-white px-3 py-3" onChange={(event) => setExpiresAt(event.target.value)} type="date" value={expiresAt} /></label>
          <label className="block"><span className="text-sm text-slate-300">Límite de usos</span><input className="mt-2 w-full rounded border border-datum-line bg-white px-3 py-3" min="1" onChange={(event) => setMaxUses(event.target.value)} placeholder="Sin límite" type="number" value={maxUses} /></label>
          <label className="flex items-start gap-3 rounded border border-datum-line bg-white/[0.03] p-3 text-sm text-slate-200"><input checked={onePerEmail} className="mt-1 size-4" onChange={(event) => setOnePerEmail(event.target.checked)} type="checkbox" /><span><strong className="block text-white">1 uso por cliente</strong>El mismo email solo podrá usar este código una vez.</span></label>
          <label className="block"><span className="text-sm text-slate-300">Base mínima</span><input className="mt-2 w-full rounded border border-datum-line bg-white px-3 py-3" min="0" onChange={(event) => setMinTaxableBase(event.target.value)} placeholder="0" type="number" value={minTaxableBase} /></label>
          <button className="w-full rounded bg-datum-cyan px-4 py-3 font-semibold text-datum-ink" onClick={submit} type="button">Crear código</button>
        </div>
      </section>

      <section className="border-t border-datum-line pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Códigos activos e históricos</h2>
            <p className="mt-1 text-sm text-slate-400">Los códigos se aplican antes del IVA.</p>
          </div>
          <p className="text-sm text-slate-400">{discountCodes.length} códigos</p>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="py-4 pr-4">Código</th><th className="px-4 py-4">Descuento</th><th className="px-4 py-4">Uso</th><th className="px-4 py-4">Cliente</th><th className="px-4 py-4">Vence</th><th className="px-4 py-4">Estado</th><th className="py-4 pl-4 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-datum-line">
              {discountCodes.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 pr-4 font-semibold">{item.code}</td>
                  <td className="px-4 py-4 text-slate-300">{item.type === "percentage" ? `${item.value}%` : formatCurrency(Number(item.value))}</td>
                  <td className="px-4 py-4 text-slate-400">{item.times_used}{item.max_uses ? ` / ${item.max_uses}` : ""}</td>
                  <td className="px-4 py-4 text-slate-400">{item.one_per_email ? "1 por email" : "Sin límite"}</td>
                  <td className="px-4 py-4 text-slate-400">{item.expires_at ? formatShortDate(item.expires_at.slice(0, 10)) : "Sin vencimiento"}</td>
                  <td className="px-4 py-4"><span className={`rounded px-2 py-1 text-xs ${item.active ? "bg-cyan-400/15 text-cyan-200" : "bg-rose-400/10 text-rose-200"}`}>{item.active ? "Activo" : "Inactivo"}</span></td>
                  <td className="py-4 pl-4 text-right">
                    <button className="mr-4 text-datum-cyan" onClick={() => onUpdate(item.id, { active: !item.active })} type="button">{item.active ? "Desactivar" : "Activar"}</button>
                    <button className="mr-4 text-slate-300" onClick={() => onUpdate(item.id, { one_per_email: !item.one_per_email })} type="button">{item.one_per_email ? "Permitir repetir" : "1 por email"}</button>
                    <button className="text-rose-200" onClick={() => onDelete(item.id)} type="button">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!discountCodes.length ? <Empty text="Todavía no hay códigos de descuento." /> : null}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) { return <div className="border-t-2 border-datum-line bg-white/[0.025] px-4 py-5"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-slate-400">{hint}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="border-t border-datum-line bg-white/[0.025] p-4"><p className="text-xs uppercase tracking-[0.1em] text-slate-500">{label}</p><p className="mt-2 text-sm font-semibold leading-6">{value}</p></div>; }
function DataLine({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b border-datum-line pb-3"><dt className="text-slate-400">{label}</dt><dd className="font-semibold">{value}</dd></div>; }
function Empty({ text }: { text: string }) { return <p className="py-8 text-center text-sm text-slate-500">{text}</p>; }
function AppointmentRow({ reservation, compact = false }: { reservation: ReservationRow; compact?: boolean }) { return <div className={`${compact ? "rounded border border-datum-line bg-white/[0.03] p-3" : "py-4"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{reservation.visit_time} · {reservation.customer_name}</p><p className="mt-1 text-sm text-slate-400">{services[reservation.service_id]?.shortName} · {reservation.full_address}</p></div>{!compact ? <span className="text-xs text-slate-500">{formatShortDate(reservation.visit_date)}</span> : null}</div></div>; }
function sortByVisit(a: ReservationRow, b: ReservationRow) { return `${a.visit_date} ${a.visit_time}`.localeCompare(`${b.visit_date} ${b.visit_time}`); }
function formatLongDate(value: string) { return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${value}T12:00:00`)); }
function formatShortDate(value: string) { return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function toDateValue(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function getCalendarDays(month: Date) { const first = new Date(month.getFullYear(), month.getMonth(), 1); const offset = (first.getDay() + 6) % 7; const start = new Date(month.getFullYear(), month.getMonth(), 1 - offset); return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)); }
