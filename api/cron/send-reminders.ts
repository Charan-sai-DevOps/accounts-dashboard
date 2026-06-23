import { differenceInCalendarDays, parseISO, isValid } from "date-fns";
import { firestore } from "../_firebaseAdmin.js";
import { sendEmail } from "../mail.js";

const SETTINGS_DOC_ID = "app";
const SETTINGS_COLLECTION = "settings";
const SUBSCRIPTIONS_COLLECTION = "subscriptions";
const CRON_SECRET = process.env.CRON_SECRET;

function parseExpiryDate(value: any): Date | null {
  if (!value) return null;

  if (typeof value === "object" && value?.toDate instanceof Function) {
    return value.toDate();
  }

  if (typeof value === "string") {
    const parsed = parseISO(value);
    if (isValid(parsed)) {
      return parsed;
    }
    const fallback = new Date(value);
    return isValid(fallback) ? fallback : null;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return isValid(date) ? date : null;
  }

  return null;
}

function buildReminderHtml(email: string, sections: Array<{ title: string; items: any[] }>) {
  if (sections.length === 0) {
    return `<p>No subscription reminders are due today.</p>`;
  }

  const sectionMarkup = sections
    .map(
      (section) => `
      <section style="margin-bottom:24px;">
        <h2 style="font-size:18px;margin-bottom:10px;">${section.title}</h2>
        <ul style="padding-left:16px;">
          ${section.items
            .map(
              (item) => `
            <li style="margin-bottom:8px;">
              <strong>${item.platform || item.plan || "Subscription"}</strong> — expires on ${item.expiryDate}
            </li>`
            )
            .join("")}
        </ul>
      </section>`
    )
    .join("");

  return `
    <div style="font-family:Arial, sans-serif;color:#111;line-height:1.6;">
      <p>Hello,</p>
      <p>Here are your subscription renewal reminders:</p>
      ${sectionMarkup}
      <p>If you want to update your reminder preferences, open your subscription dashboard settings.</p>
    </div>`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  if (CRON_SECRET && req.query.secret !== CRON_SECRET) {
    return res.status(401).json({ error: "Invalid cron secret." });
  }

  const settingsDoc = await firestore.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).get();
  if (!settingsDoc.exists) {
    return res.status(404).json({ error: "Settings document not found." });
  }

  const settings = settingsDoc.data();
  const email = typeof settings?.email === "string" ? settings.email : "";

  if (!email) {
    return res.status(400).json({ error: "User email is required to send reminders." });
  }

  const snapshot = await firestore.collection(SUBSCRIPTIONS_COLLECTION).get();
  const now = new Date();
  const remindersByBucket = {
    "7 days before": [] as any[],
    "3 days before": [] as any[],
    "day of renewal": [] as any[],
  };

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const expiryDate = parseExpiryDate(data.expiryDate);
    if (!expiryDate) return;

    const diff = differenceInCalendarDays(expiryDate, now);
    const item = { ...data, expiryDate: expiryDate.toISOString().split("T")[0] };

    if (diff === 7 && settings.reminders?.before7Days) {
      remindersByBucket["7 days before"].push(item);
    }

    if (diff === 3 && settings.reminders?.before3Days) {
      remindersByBucket["3 days before"].push(item);
    }

    if (diff === 0 && settings.reminders?.onDay) {
      remindersByBucket["day of renewal"].push(item);
    }
  });

  const sections = Object.entries(remindersByBucket)
    .filter(([, items]) => items.length > 0)
    .map(([title, items]) => ({ title, items }));

  if (sections.length === 0) {
    return res.status(200).json({ message: "No reminders due today." });
  }

  try {
    await sendEmail({
      to: email,
      subject: "Subscription Renewal Reminder",
      html: buildReminderHtml(email, sections),
    });
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    return res.status(500).json({ error: "Failed to send email." });
  }

  return res.status(200).json({ message: "Reminder email sent.", sections });
}
