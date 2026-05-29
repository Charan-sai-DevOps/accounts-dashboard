import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || "587");
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.EMAIL_FROM || "no-reply@example.com";

if (!host || !user || !pass) {
  throw new Error("Missing SMTP environment variables. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.");
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: {
    user,
    pass,
  },
});

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

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });
}
