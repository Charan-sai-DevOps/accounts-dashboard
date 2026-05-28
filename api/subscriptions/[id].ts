import { firestore } from "../_firebaseAdmin.js";

export default async function handler(req, res) {
  const { id } = req.query;
  const docId = Array.isArray(id) ? id[0] : id;

  if (!docId) {
    return res.status(400).json({ error: "Missing subscription ID." });
  }

  const docRef = firestore.collection("subscriptions").doc(docId);

  if (req.method === "PUT") {
    await docRef.set(req.body, { merge: true });
    return res.status(200).json({ id: docId });
  }

  if (req.method === "DELETE") {
    await docRef.delete();
    return res.status(204).end();
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).end();
}
