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

async function sendEmailUtil({
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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { email, action } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email address is required." });
  }

  try {
    // Test email action
    if (action === "test") {
      await sendEmailUtil({
        to: email,
        subject: "Test Email from Subscription Dashboard",
        html: `
          <div style="font-family:Arial, sans-serif;color:#111;line-height:1.6;">
            <p>Hello,</p>
            <p>This is a test email from your Subscription Dashboard.</p>
            <p>If you received this message, your email notifications are working correctly!</p>
            <p style="margin-top:20px;color:#999;font-size:12px;">
              This is an automated message. Please do not reply directly.
            </p>
          </div>
        `,
        text: "This is a test email from your Subscription Dashboard. If you received this message, your email notifications are working correctly!",
      });

      return res.status(200).json({ message: "Test email sent successfully." });
    }

    return res.status(400).json({ error: "Invalid action. Use action: 'test'" });
  } catch (error) {
    console.error("Failed to send email:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to send email.",
    });
  }
}

export { sendEmailUtil as sendEmail };
