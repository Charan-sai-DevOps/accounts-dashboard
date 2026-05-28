import { firestore } from "./_firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const snapshot = await firestore.collection("subscriptions").get();
    const subscriptions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(subscriptions);
  }

  if (req.method === "POST") {
    const data = req.body;
    const docRef = await firestore.collection("subscriptions").add(data);
    return res.status(201).json({ id: docRef.id });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end();
}
