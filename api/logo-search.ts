const LOGODEV_SEARCH_ENDPOINT = "https://api.logo.dev/search";
const LOGODEV_SECRET_KEY = process.env.LOGODEV_SECRET_KEY || "sk_BtVHwUoqTEyk4YwAwxbAcQ";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const query = String(req.query?.q ?? "").trim();
  const strategy = req.query?.strategy === "match" ? "match" : "typeahead";

  if (!query || query.length < 2) {
    return res.status(200).json([]);
  }

  if (!LOGODEV_SECRET_KEY) {
    return res.status(500).json({ message: "Missing Logo.dev secret key." });
  }

  try {
    const response = await fetch(`${LOGODEV_SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&strategy=${strategy}`, {
      headers: {
        Authorization: `Bearer ${LOGODEV_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ message: errorText || "Logo search failed." });
    }

    const results = await response.json();
    return res.status(200).json(Array.isArray(results) ? results : []);
  } catch (error) {
    console.error("Logo.dev brand search failed:", error);
    return res.status(500).json({ message: "Unable to search brands right now." });
  }
}
