import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY environment variable is not set");
  return new Resend(apiKey);
}

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3200")
  );
}

const FROM_ADDRESS = process.env.INVITE_FROM_EMAIL ?? "RøhneSelmer LMS <onboarding@resend.dev>";

export async function sendInviteEmail(to: string, name: string, token: string) {
  const resend = getResend();
  const link = `${appUrl()}/sett-passord?token=${token}`;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Du er invitert til RøhneSelmer LMS",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #17284A;">Velkommen til RøhneSelmer LMS, ${name}!</h2>
        <p>En administrator har opprettet en konto til deg. Klikk på lenken under for å sette ditt eget passord og logge inn.</p>
        <p style="margin: 24px 0;">
          <a href="${link}" style="background-color: #FD5900; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Sett passord og aktiver konto
          </a>
        </p>
        <p style="color: #5b6b85; font-size: 13px;">Lenken er gyldig i 7 dager. Hvis knappen ikke fungerer, kopier denne lenken: ${link}</p>
      </div>
    `,
  });
}
