interface BrandSearchResult {
  name: string;
  domain: string;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const query = String(req.query?.q ?? "").trim();

  if (!query || query.length < 2) {
    return res.status(200).json([]);
  }

  try {
    // Try Clearbit API first
    const clearbitResults = await searchClearbit(query);
    if (clearbitResults.length > 0) {
      return res.status(200).json(clearbitResults);
    }

    // Fallback to DuckDuckGo
    const duckduckgoResults = await searchDuckDuckGo(query);
    return res.status(200).json(duckduckgoResults);
  } catch (error) {
    console.error("Brand search failed:", error);
    return res.status(200).json([]);
  }
}

async function searchClearbit(query: string): Promise<BrandSearchResult[]> {
  try {
    const response = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      return [];
    }

    const data: any = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .slice(0, 5)
      .map((company: any) => ({
        name: company.name || "",
        domain: company.domain || "",
      }))
      .filter((result: BrandSearchResult) => result.name && result.domain);
  } catch (error) {
    console.warn("Clearbit search failed:", error);
    return [];
  }
}

async function searchDuckDuckGo(query: string): Promise<BrandSearchResult[]> {
  try {
    const response = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );

    if (!response.ok) {
      return [];
    }

    const data: any = await response.json();
    const results: BrandSearchResult[] = [];

    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
        const url = topic.FirstURL || topic.Icon?.URL || "";
        if (url) {
          try {
            const domain = new URL(url).hostname || url;
            results.push({
              name: topic.Text ? topic.Text.split(" - ")[0].trim() : query,
              domain: domain,
            });
          } catch {}
        }
      });
    }

    return results.slice(0, 5);
  } catch (error) {
    console.warn("DuckDuckGo search failed:", error);
    return [];
  }
}
