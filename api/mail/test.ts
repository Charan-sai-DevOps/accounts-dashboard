import { sendEmail } from "./sendEmail.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email address is required." });
  }

  try {
    await sendEmail({
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
  } catch (error) {
    console.error("Failed to send test email:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to send test email.",
    });
  }
}
