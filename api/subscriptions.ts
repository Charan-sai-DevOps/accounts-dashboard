import { firestore } from "./_firebaseAdmin.js";
import { sendEmail } from "./mail/sendEmail.js";

const SETTINGS_DOC_ID = "app";
const SETTINGS_COLLECTION = "settings";

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    const snapshot = await firestore.collection("subscriptions").get();
    const subscriptions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(subscriptions);
  }

  if (req.method === "POST") {
    const data = req.body;

    // Run Firestore add and settings fetch in parallel
    const [docRef, settingsDoc] = await Promise.all([
      firestore.collection("subscriptions").add(data),
      firestore.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).get(),
    ]);

    // Fire email notification in the background (don't await)
    if (settingsDoc.exists) {
      const settings = settingsDoc.data();
      const email = typeof settings?.email === "string" ? settings.email : "";
      const shouldNotify = Boolean(settings?.notifications?.newSubscriptionAdded);

      if (shouldNotify && email) {
        sendEmail({
          to: email,
          subject: "New subscription added",
          html: `
            <div style="font-family:Arial, sans-serif;color:#111;line-height:1.5;">
              <p>Hello,</p>
              <p>A new subscription has been added to your dashboard:</p>
              <ul>
                <li><strong>${data.platform || data.plan || "Subscription"}</strong></li>
                <li>Expiry date: ${data.expiryDate || "N/A"}</li>
              </ul>
              <p>Open your dashboard to review the details.</p>
            </div>
          `,
        }).catch((error: unknown) => {
          console.error("Failed to send new-subscription notification:", error);
        });
      }
    }

    return res.status(201).json({ id: docRef.id });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
}
