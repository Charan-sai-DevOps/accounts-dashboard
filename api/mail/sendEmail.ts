import nodemailer from "nodemailer";

const from = process.env.EMAIL_FROM || "no-reply@example.com";
let transporter: any = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Missing SMTP environment variables. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (!to) {
    throw new Error("Email recipient is required.");
  }

  const transport = getTransporter();

  await transport.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });
}
