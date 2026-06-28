export async function sendReservationEmail(_params: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) return { skipped: true };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "DATUM Mediciones <reservas@medicionesdatum.es>",
      to: _params.to,
      subject: _params.subject,
      html: _params.html
    })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}
