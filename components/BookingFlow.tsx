"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getAllowedSlots, isPastDate, nextBusinessDate } from "@/lib/availability";
import { calculateQuote, formatCurrency, services } from "@/lib/pricing";
import type { Discount, RepresentationType, ReservationInput, ServiceId } from "@/lib/types";

const steps = [
  "Servicio",
  "Superficie",
  "Adicionales",
  "Representación",
  "Fecha",
  "Datos",
  "Pago"
];

const representations: {
  id: RepresentationType;
  title: string;
  body: string;
  hint: string;
}[] = [
  {
    id: "geometria_real",
    title: "Geometría real",
    body: "Representación exacta del estado existente, con desviaciones, ángulos reales e irregularidades.",
    hint: "Para una precisión total de la realidad construida."
  },
  {
    id: "representacion_ortogonalizada",
    title: "Representación ortogonalizada",
    body: "Geometría ajustada para proyectos, distribuciones y reformas con planos limpios y fáciles de trabajar.",
    hint: "Para desarrollo técnico y documentación optimizada."
  }
];

const initialForm: ReservationInput = {
  serviceId: "plans_2d",
  surface: 50,
  additionalPlans: 0,
  additionalSections: 0,
  additionalElevations: 0,
  representation: "representacion_ortogonalizada",
  visitDate: nextBusinessDate(),
  visitTime: "09:00",
  customerName: "",
  email: "",
  phone: "",
  fullAddress: "",
  street: "",
  number: "",
  floor: "",
  postalCode: "",
  propertyFloors: 1,
  notes: "",
  couponCode: "",
  acceptsTerms: false,
  acceptsMarketing: false
};

export default function BookingFlow() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ReservationInput>(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [discountMessage, setDiscountMessage] = useState("");

  const quote = useMemo(() => calculateQuote({ ...form, discount }), [form, discount]);
  const allowedSlots = useMemo(
    () =>
      getAllowedSlots(form.visitDate).filter(
        (slot) => !unavailableSlots.includes(`${form.visitDate}|${slot}`)
      ),
    [form.visitDate, unavailableSlots]
  );
  const additionalCount =
    form.additionalPlans + form.additionalSections + form.additionalElevations;

  useEffect(() => {
    let isCurrent = true;
    setAvailabilityDate("");
    fetch(`/api/availability?from=${form.visitDate}&to=${form.visitDate}`)
      .then((response) => response.json())
      .then((payload) => {
        if (!isCurrent) return;
        setUnavailableSlots(payload.unavailableSlots ?? []);
        setAvailabilityDate(form.visitDate);
      })
      .catch(() => {
        if (isCurrent) setAvailabilityDate(form.visitDate);
      });
    return () => {
      isCurrent = false;
    };
  }, [form.visitDate]);

  useEffect(() => {
    if (availabilityDate !== form.visitDate) return;
    if (!allowedSlots.includes(form.visitTime)) {
      setForm((current) => ({ ...current, visitTime: allowedSlots[0] ?? "" }));
    }
  }, [allowedSlots, availabilityDate, form.visitDate, form.visitTime]);

  useEffect(() => {
    const code = form.couponCode?.trim();
    if (!code) {
      setDiscount(null);
      setDiscountMessage("");
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        code,
        serviceId: form.serviceId,
        surface: String(form.surface),
        additionalPlans: String(form.additionalPlans),
        additionalSections: String(form.additionalSections),
        additionalElevations: String(form.additionalElevations)
      });

      fetch(`/api/discount-codes?${params.toString()}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((payload) => {
          setDiscount(payload.discount ?? null);
          setDiscountMessage(payload.discount ? "Código aplicado." : "Código no válido o no disponible.");
        })
        .catch(() => null);
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [
    form.additionalElevations,
    form.additionalPlans,
    form.additionalSections,
    form.couponCode,
    form.serviceId,
    form.surface
  ]);

  function patchForm(update: Partial<ReservationInput>) {
    setForm((current) => ({ ...current, ...update }));
    setError("");
  }

  function validateCurrentStep() {
    if (step === 1 && (!form.surface || form.surface <= 0)) {
      return "Introduce una superficie válida.";
    }

    if (step === 1 && form.surface > 400) {
      return "Para inmuebles superiores a 400 m², el presupuesto se realiza de forma personalizada.";
    }

    if (step === 3 && !form.representation) {
      return "Selecciona un tipo de representación.";
    }

    if (step === 4) {
      if (isPastDate(form.visitDate)) return "No se pueden reservar fechas pasadas.";
      if (!allowedSlots.includes(form.visitTime)) return "Selecciona un horario disponible.";
    }

    if (step === 5) {
      if (!form.customerName || !form.email || !form.phone) {
        return "Completa tus datos personales.";
      }
      if (!form.fullAddress || !form.postalCode || !form.propertyFloors) {
        return "Completa los datos del inmueble.";
      }
    }

    if (step === 6 && !form.acceptsTerms) {
      return "Acepta los términos obligatorios antes de pagar.";
    }

    return "";
  }

  function goNext() {
    const message = validateCurrentStep();
    if (message) {
      setError(message);
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submitReservation() {
    const message = validateCurrentStep();
    if (message) {
      setError(message);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo crear la reserva.");
      window.location.href = payload.checkoutUrl;
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo iniciar el pago."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="datum-hero">
        <div className="datum-hero-shade" />
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8">
          <a aria-label="DATUM Mediciones, inicio" href="/">
            <Image
              alt="DATUM"
              className="h-auto w-40 md:w-52"
              height={300}
              priority
              src="/assets/datum-logo.png"
              width={1200}
            />
          </a>
          <a
            href="/admin"
            className="rounded border border-white/30 bg-datum-ink/30 px-4 py-2 text-sm text-white backdrop-blur transition hover:border-datum-cyan"
          >
            Acceso admin
          </a>
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[480px] max-w-7xl items-end px-5 pb-14 md:min-h-[560px] md:px-8 md:pb-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-datum-cyan">
              Medición y documentación técnica
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-6xl">
              La realidad de tu inmueble, medida con precisión.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 md:text-lg md:leading-8">
              DATUM documenta la realidad exacta de tu inmueble mediante escaneado
              láser 3D de última generación. Convertimos la captura de datos en
              nubes de puntos, planos 2D y modelos 3D precisos, listos para
              proyectar, reformar, construir o analizar con una base técnica fiable.
            </p>
            <a
              className="mt-8 inline-flex rounded bg-datum-cyan px-6 py-3 font-semibold text-datum-ink transition hover:bg-cyan-200"
              href="#reserva"
            >
              Reservar medición
            </a>
          </div>
        </div>
      </header>

      <main className="px-4 py-10 md:px-8 md:py-16" id="reserva">
        <div className="mx-auto mb-8 max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-datum-cyan">
            Reserva online
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            Reserva tu medición láser 3D
          </h2>
        </div>

        <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-datum-line bg-datum-panel/80 p-5 shadow-glow md:p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            {steps.map((item, index) => (
              <button
                key={item}
                className={`rounded px-3 py-2 text-xs font-semibold ${
                  index === step
                    ? "bg-datum-cyan text-datum-ink"
                    : index < step
                      ? "bg-white/15 text-white"
                      : "bg-white/5 text-slate-400"
                }`}
                onClick={() => setStep(index)}
                type="button"
              >
                {index + 1}. {item}
              </button>
            ))}
          </div>

          {step === 0 ? (
            <StepServices
              value={form.serviceId}
              onChange={(serviceId) => patchForm({ serviceId })}
            />
          ) : null}

          {step === 1 ? (
            <StepSurface
              surface={form.surface}
              rangeLabel={quote.rangeLabel}
              basePrice={quote.basePrice}
              isCustomQuote={quote.isCustomQuote}
              onChange={(surface) => patchForm({ surface })}
            />
          ) : null}

          {step === 2 ? (
            <StepAdditionals
              form={form}
              unitPrice={quote.additionalUnitPrice}
              onChange={patchForm}
            />
          ) : null}

          {step === 3 ? (
            <StepRepresentation
              value={form.representation}
              onChange={(representation) => patchForm({ representation })}
            />
          ) : null}

          {step === 4 ? (
            <StepDate
              form={form}
              allowedSlots={allowedSlots}
              onChange={patchForm}
            />
          ) : null}

          {step === 5 ? <StepCustomer form={form} onChange={patchForm} /> : null}

          {step === 6 ? (
            <StepPayment
          form={form}
          additionalCount={additionalCount}
          discountMessage={discountMessage}
          quote={quote}
          onChange={patchForm}
        />
          ) : null}

          {error ? (
            <p className="mt-5 rounded border border-red-400/50 bg-red-500/10 p-4 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <button
              className="rounded border border-datum-line px-5 py-3 text-slate-100 transition hover:border-datum-cyan disabled:opacity-40"
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              type="button"
            >
              Volver
            </button>
            {step < steps.length - 1 ? (
              <button
                className="rounded bg-datum-cyan px-6 py-3 font-semibold text-datum-ink transition hover:bg-cyan-200"
                onClick={goNext}
                type="button"
              >
                Continuar
              </button>
            ) : (
              <button
                className="rounded bg-datum-cyan px-6 py-3 font-semibold text-datum-ink transition hover:bg-cyan-200 disabled:opacity-50"
                disabled={isSubmitting}
                onClick={submitReservation}
                type="button"
              >
                {isSubmitting ? "Preparando pago..." : "Pagar depósito y reservar"}
              </button>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-datum-line bg-white/8 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-datum-cyan">
            Resumen
          </p>
          <h2 className="mt-3 text-xl font-semibold text-white">
            {services[form.serviceId].name}
          </h2>
          <dl className="mt-5 space-y-3 text-sm">
            <SummaryLine label="Superficie" value={`${form.surface || 0} m²`} />
            <SummaryLine label="Rango" value={quote.rangeLabel || "Pendiente"} />
            <SummaryLine label="Adicionales" value={`${additionalCount}`} />
            <SummaryLine label="Base imponible" value={formatCurrency(quote.taxableBase)} />
            <SummaryLine label="IVA 21%" value={formatCurrency(quote.vat)} />
            <SummaryLine label="Total" value={formatCurrency(quote.total)} strong />
            <SummaryLine label="Depósito" value={formatCurrency(quote.deposit)} strong />
            <SummaryLine label="Saldo pendiente" value={formatCurrency(quote.pendingBalance)} />
          </dl>
          <div className="mt-6 rounded border border-datum-line bg-datum-ink/70 p-4 text-sm leading-6 text-slate-300">
            <p>
              Precios válidos para Madrid ciudad. Fuera del municipio de Madrid,
              contacta en info@medicionesdatum.es.
            </p>
            <p className="mt-3 text-slate-200">
              Una vez confirmado el pago, nuestro técnico se contactará contigo
              para coordinar la medición en la dirección proporcionada.
            </p>
            <p className="mt-3 text-slate-300">
              Podrás solicitar un cambio de día hasta 48 horas antes de la cita.
              Pasado ese plazo, cualquier modificación deberá coordinarse
              directamente con DATUM.
            </p>
          </div>
        </aside>
        </section>
      </main>

      <footer className="border-t border-datum-line bg-[#071321]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.2fr_1fr_1fr] md:px-8 md:py-16">
          <div>
            <Image
              alt="DATUM"
              className="h-auto w-44"
              height={300}
              src="/assets/datum-logo.png"
              width={1200}
            />
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Escaneado láser 3D, planos 2D y modelos 3D precisos para trabajar
              sobre una base técnica fiable.
            </p>
            <div className="mt-6 flex gap-3">
              <SocialLink href="https://www.linkedin.com/company/medicionesdatum/" label="LinkedIn">in</SocialLink>
              <SocialLink href="https://www.instagram.com/datum.mediciones" label="Instagram">ig</SocialLink>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
              Horario de atención
            </h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
              <p><strong className="block text-white">Lunes a jueves</strong>08:30 - 17:00</p>
              <p><strong className="block text-white">Viernes</strong>08:30 - 14:00</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
              Contacto
            </h2>
            <address className="mt-5 space-y-3 text-sm not-italic leading-6 text-slate-300">
              <a aria-label="Llamar a DATUM al +34 613 676 524" className="datum-contact-link" href="tel:+34613676524">+34 613 676 524</a>
              <a aria-label="Llamar a DATUM al +34 915 271 501" className="datum-contact-link" href="tel:+34915271501">+34 915 271 501</a>
              <a className="datum-contact-link" href="mailto:info@medicionesdatum.es">info@medicionesdatum.es</a>
              <a
                className="datum-contact-link max-w-xs"
                href="https://www.google.com/maps/search/?api=1&query=Calle+de+Tarragona+20+28045+Madrid"
                rel="noreferrer"
                target="_blank"
              >
                C. de Tarragona 20, Arganzuela, Madrid, 28045
              </a>
            </address>
          </div>
        </div>
        <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} DATUM Mediciones. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      aria-label={label}
      className="flex size-10 items-center justify-center rounded border border-datum-line text-xs font-bold uppercase text-datum-cyan transition hover:border-datum-cyan hover:bg-datum-cyan hover:text-datum-ink"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

function StepServices({
  value,
  onChange
}: {
  value: ServiceId;
  onChange: (serviceId: ServiceId) => void;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">Elige tu servicio</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {Object.entries(services).map(([id, service]) => (
          <button
            className={`rounded-lg border p-5 text-left transition ${
              value === id
                ? "border-datum-cyan bg-datum-cyan/10"
                : "border-datum-line bg-white/5 hover:border-datum-cyan"
            }`}
            key={id}
            onClick={() => onChange(id as ServiceId)}
            type="button"
          >
            <p className="text-lg font-semibold text-white">{service.name}</p>
            <p className="mt-3 min-h-24 text-sm leading-6 text-slate-300">
              {service.description}
            </p>
            <p className="mt-4 text-sm text-datum-cyan">{service.delivery}</p>
            <p className="mt-2 font-semibold">Desde {formatCurrency(service.from)}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function StepSurface({
  surface,
  rangeLabel,
  basePrice,
  isCustomQuote,
  onChange
}: {
  surface: number;
  rangeLabel: string;
  basePrice: number;
  isCustomQuote: boolean;
  onChange: (surface: number) => void;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">Superficie del inmueble</h2>
      <label className="mt-5 block text-sm text-slate-300" htmlFor="surface">
        Introduce la superficie aproximada del inmueble en m².
      </label>
      <input
        className="focus-ring mt-2 w-full rounded border border-datum-line bg-white px-4 py-3 text-lg"
        id="surface"
        min="1"
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={surface || ""}
      />
      {isCustomQuote ? (
        <div className="mt-5 rounded border border-datum-cyan bg-datum-cyan/10 p-5">
          <p className="font-semibold text-white">Presupuesto personalizado</p>
          <p className="mt-2 text-slate-200">
            Para inmuebles superiores a 400 m², el presupuesto se realizará de
            forma personalizada. Contáctanos en info@medicionesdatum.es.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Metric label="Rango detectado" value={rangeLabel || "Pendiente"} />
          <Metric label="Precio base" value={formatCurrency(basePrice)} />
        </div>
      )}
    </section>
  );
}

function StepAdditionals({
  form,
  unitPrice,
  onChange
}: {
  form: ReservationInput;
  unitPrice: number;
  onChange: (update: Partial<ReservationInput>) => void;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">Adicionales</h2>
      <p className="mt-3 text-slate-300">
        Añade plantas, secciones o alzados adicionales. Precio unitario según
        superficie: {formatCurrency(unitPrice)}.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Quantity
          label="Plantas adicionales"
          value={form.additionalPlans}
          onChange={(value) => onChange({ additionalPlans: value })}
        />
        <Quantity
          label="Secciones adicionales"
          value={form.additionalSections}
          onChange={(value) => onChange({ additionalSections: value })}
        />
        <Quantity
          label="Alzados adicionales"
          value={form.additionalElevations}
          onChange={(value) => onChange({ additionalElevations: value })}
        />
      </div>
    </section>
  );
}

function StepRepresentation({
  value,
  onChange
}: {
  value: RepresentationType;
  onChange: (value: RepresentationType) => void;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">Tipo de representación</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {representations.map((item) => (
          <button
            className={`rounded-lg border p-5 text-left transition ${
              value === item.id
                ? "border-datum-cyan bg-datum-cyan/10"
                : "border-datum-line bg-white/5 hover:border-datum-cyan"
            }`}
            key={item.id}
            onClick={() => onChange(item.id)}
            type="button"
          >
            <p className="text-lg font-semibold text-white">{item.title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{item.body}</p>
            <p className="mt-4 text-sm text-datum-cyan">{item.hint}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function StepDate({
  form,
  allowedSlots,
  onChange
}: {
  form: ReservationInput;
  allowedSlots: string[];
  onChange: (update: Partial<ReservationInput>) => void;
}) {
  const selectedDate = new Date(`${form.visitDate}T12:00:00`);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
  const monthLabel = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric"
  }).format(visibleMonth);
  const nextVisibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  const nextMonthLabel = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric"
  }).format(nextVisibleMonth);
  const selectedLabel = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(selectedDate);

  function selectDate(dateValue: string) {
    const slots = getAllowedSlots(dateValue);
    onChange({
      visitDate: dateValue,
      visitTime: slots.includes(form.visitTime) ? form.visitTime : (slots[0] ?? "")
    });
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold">Fecha y hora</h2>
      <p className="mt-2 text-sm text-slate-300">
        Selecciona un día disponible y después el horario de la visita.
      </p>

      <div className="mt-5 max-w-xl rounded-lg border border-datum-line bg-white/5 p-4 md:p-5">
        <div className="flex items-center justify-between gap-4">
          <button
            aria-label="Mes anterior"
            className="focus-ring flex size-10 items-center justify-center rounded border border-datum-line text-xl text-white transition hover:border-datum-cyan"
            onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            type="button"
          >
            ‹
          </button>
          <p className="text-center font-semibold capitalize text-white">{monthLabel}</p>
          <button
            aria-label="Mes siguiente"
            className="focus-ring flex size-10 items-center justify-center rounded border border-datum-line text-xl text-white transition hover:border-datum-cyan"
            onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            type="button"
          >
            ›
          </button>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <CalendarMonth
            month={visibleMonth}
            selectedDate={form.visitDate}
            title={monthLabel}
            onSelect={selectDate}
          />
          <CalendarMonth
            month={nextVisibleMonth}
            selectedDate={form.visitDate}
            title={nextMonthLabel}
            onSelect={selectDate}
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="font-semibold capitalize text-white">{selectedLabel}</p>
        <p className="mt-1 text-sm text-slate-400">Horas disponibles</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {allowedSlots.map((slot) => (
          <button
            className={`rounded px-5 py-3 font-semibold transition ${
              form.visitTime === slot
                ? "bg-datum-cyan text-datum-ink"
                : "border border-datum-line bg-white/5 text-white hover:border-datum-cyan"
            }`}
            key={slot}
            onClick={() => onChange({ visitTime: slot })}
            type="button"
          >
            {slot}
          </button>
        ))}
        {!allowedSlots.length ? (
          <p className="rounded border border-datum-line bg-white/5 p-4 text-sm text-slate-300">
            No hay horarios automáticos para esta fecha. Para reservar fuera de
            los horarios establecidos, contacta en info@medicionesdatum.es.
          </p>
        ) : null}
      </div>
    </section>
  );
}

const calendarWeekdays = ["L", "M", "X", "J", "V", "S", "D"];

function CalendarMonth({
  month,
  selectedDate,
  title,
  onSelect
}: {
  month: Date;
  selectedDate: string;
  title: string;
  onSelect: (dateValue: string) => void;
}) {
  const calendarDays = getCalendarDays(month);

  return (
    <div>
      <p className="mb-3 text-center text-sm font-semibold capitalize text-slate-200">{title}</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarWeekdays.map((weekday) => (
          <span className="py-2 text-xs font-semibold uppercase text-slate-400" key={weekday}>
            {weekday}
          </span>
        ))}
        {calendarDays.map((day) => {
          const dateValue = toDateValue(day);
          const isCurrentMonth = day.getMonth() === month.getMonth();
          const isAvailable = isCurrentMonth && !isPastDate(dateValue) && getAllowedSlots(dateValue).length > 0;
          const isSelected = dateValue === selectedDate;

          return (
            <button
              aria-label={new Intl.DateTimeFormat("es-ES", { dateStyle: "full" }).format(day)}
              className={`focus-ring aspect-square min-h-9 rounded text-sm font-semibold transition ${
                isSelected
                  ? "bg-datum-cyan text-datum-ink"
                  : isAvailable
                    ? "text-white hover:bg-white/15"
                    : "cursor-not-allowed text-slate-600"
              }`}
              disabled={!isAvailable}
              key={dateValue}
              onClick={() => onSelect(dateValue)}
              type="button"
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
  );
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function StepCustomer({
  form,
  onChange
}: {
  form: ReservationInput;
  onChange: (update: Partial<ReservationInput>) => void;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">Datos del cliente e inmueble</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Nombre completo" value={form.customerName} onChange={(customerName) => onChange({ customerName })} />
        <Field label="Email" type="email" value={form.email} onChange={(email) => onChange({ email })} />
        <Field label="Teléfono" value={form.phone} onChange={(phone) => onChange({ phone })} />
        <Field label="Código postal" value={form.postalCode} onChange={(postalCode) => onChange({ postalCode })} />
        <Field label="Dirección completa" className="md:col-span-2" value={form.fullAddress} onChange={(fullAddress) => onChange({ fullAddress })} />
        <Field label="Calle" value={form.street ?? ""} onChange={(street) => onChange({ street })} />
        <Field label="Número" value={form.number ?? ""} onChange={(number) => onChange({ number })} />
        <Field label="Piso" value={form.floor ?? ""} onChange={(floor) => onChange({ floor })} />
        <Field label="Número de plantas" type="number" value={String(form.propertyFloors)} onChange={(propertyFloors) => onChange({ propertyFloors: Number(propertyFloors) })} />
        <label className="md:col-span-2">
          <span className="text-sm text-slate-300">Información adicional</span>
          <textarea
            className="focus-ring mt-2 min-h-32 w-full rounded border border-datum-line bg-white px-4 py-3"
            onChange={(event) => onChange({ notes: event.target.value })}
            value={form.notes}
          />
        </label>
      </div>
    </section>
  );
}

function StepPayment({
  form,
  additionalCount,
  discountMessage,
  quote,
  onChange
}: {
  form: ReservationInput;
  additionalCount: number;
  discountMessage: string;
  quote: ReturnType<typeof calculateQuote>;
  onChange: (update: Partial<ReservationInput>) => void;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">Resumen y pago</h2>
      <div className="mt-5 rounded-lg border border-datum-line bg-white/5 p-5">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <SummaryLine label="Servicio" value={services[form.serviceId].name} />
          <SummaryLine label="Superficie" value={`${form.surface} m²`} />
          <SummaryLine label="Rango" value={quote.rangeLabel} />
          <SummaryLine label="Adicionales" value={`${additionalCount}`} />
          <SummaryLine label="Representación" value={form.representation === "geometria_real" ? "Geometría real" : "Representación ortogonalizada"} />
          <SummaryLine label="Fecha y hora" value={`${form.visitDate} ${form.visitTime}`} />
          <SummaryLine label="Base imponible" value={formatCurrency(quote.taxableBase)} />
          <SummaryLine label="IVA 21%" value={formatCurrency(quote.vat)} />
          <SummaryLine label="Total" value={formatCurrency(quote.total)} strong />
          <SummaryLine label="Depósito para reservar" value={formatCurrency(quote.deposit)} strong />
          <SummaryLine label="Saldo pendiente" value={formatCurrency(quote.pendingBalance)} />
        </dl>
      </div>
      <label className="mt-5 block">
        <span className="text-sm text-slate-300">Cupón de descuento</span>
        <input
          className="focus-ring mt-2 w-full rounded border border-datum-line bg-white px-4 py-3 md:max-w-sm"
          onChange={(event) => onChange({ couponCode: event.target.value })}
          placeholder="Escribe aquí tu código"
          value={form.couponCode}
        />
        {discountMessage ? (
          <span className="mt-2 block text-sm text-slate-300">{discountMessage}</span>
        ) : null}
      </label>
      <label className="mt-5 flex gap-3 text-sm text-slate-200">
        <input
          checked={form.acceptsTerms}
          className="mt-1 size-4"
          onChange={(event) => onChange({ acceptsTerms: event.target.checked })}
          type="checkbox"
        />
        <span>
          Acepto los términos y condiciones, la política de cancelación y la
          política de privacidad. Entiendo que puedo solicitar un cambio de día
          hasta 48 horas antes de la cita; después de ese plazo, deberé
          contactar directamente con DATUM para coordinar cualquier modificación.
        </span>
      </label>
      <label className="mt-3 flex gap-3 text-sm text-slate-300">
        <input
          checked={form.acceptsMarketing}
          className="mt-1 size-4"
          onChange={(event) => onChange({ acceptsMarketing: event.target.checked })}
          type="checkbox"
        />
        <span>Acepto recibir comunicaciones comerciales de DATUM.</span>
      </label>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className = ""
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="text-sm text-slate-300">{label}</span>
      <input
        className="focus-ring mt-2 w-full rounded border border-datum-line bg-white px-4 py-3"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function Quantity({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-lg border border-datum-line bg-white/5 p-4">
      <p className="text-sm text-slate-300">{label}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          className="size-10 rounded border border-datum-line text-xl"
          onClick={() => onChange(Math.max(0, value - 1))}
          type="button"
        >
          -
        </button>
        <span className="text-2xl font-semibold">{value}</span>
        <button
          className="size-10 rounded border border-datum-line text-xl"
          onClick={() => onChange(value + 1)}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-datum-line bg-white/5 p-5">
      <p className="text-sm text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function SummaryLine({
  label,
  value,
  strong
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
      <dt className="text-slate-300">{label}</dt>
      <dd className={strong ? "font-semibold text-datum-cyan" : "text-white"}>{value}</dd>
    </div>
  );
}
