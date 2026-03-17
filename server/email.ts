import nodemailer from "nodemailer";

function createTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendEoiNotification(data: {
  name: string;
  email: string;
  roles?: string[];
}) {
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const transporter = createTransporter();

  if (!transporter || !notifyEmail) {
    console.warn("Email not configured — skipping notification. Set SMTP_USER, SMTP_PASS, and NOTIFY_EMAIL.");
    return;
  }

  await transporter.sendMail({
    from: `"Aligned" <${process.env.SMTP_USER}>`,
    to: notifyEmail,
    subject: `New demo request — ${data.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; color: #1A1A18;">
        <h2 style="margin-bottom: 1rem;">New demo request</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 6px 0; color: #5F5E5A; width: 120px;">Name</td><td style="padding: 6px 0;"><strong>${data.name}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #5F5E5A;">Email</td><td style="padding: 6px 0;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #5F5E5A;">I am a…</td><td style="padding: 6px 0;">${data.roles?.join(", ") || "—"}</td></tr>
        </table>
        <p style="margin-top: 1.5rem; font-size: 12px; color: #888780;">Sent from aligned-teams.org</p>
      </div>
    `,
  });
}
