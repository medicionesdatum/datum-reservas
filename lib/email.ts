import { Resend } from "resend";

export type ReservationEmail = {
  to: string | string[];
  subject: string;
  html: string;
};

export class EmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigurationError";
  }
}

function emailClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new EmailConfigurationError("Falta configurar RESEND_API_KEY.");
  }

  return new Resend(apiKey);
}

function emailFrom() {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    throw new EmailConfigurationError("Falta configurar EMAIL_FROM.");
  }

  return from;
}

function resendErrorMessage(error: { message?: string } | null) {
  return error?.message?.trim() || "Resend no pudo aceptar el correo.";
}

export async function sendReservationEmail(
  params: ReservationEmail & { idempotencyKey: string }
) {
  const { data, error } = await emailClient().emails.send(
    {
      from: emailFrom(),
      to: params.to,
      subject: params.subject,
      html: params.html
    },
    { idempotencyKey: params.idempotencyKey }
  );

  if (error) throw new Error(resendErrorMessage(error));
  return data;
}

export async function sendReservationEmailBatch(
  messages: ReservationEmail[],
  idempotencyKey: string
) {
  if (messages.length === 0) return [];

  const from = emailFrom();
  const { data, error } = await emailClient().batch.send(
    messages.map((message) => ({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html
    })),
    { idempotencyKey, batchValidation: "strict" }
  );

  if (error) throw new Error(resendErrorMessage(error));
  return data;
}
