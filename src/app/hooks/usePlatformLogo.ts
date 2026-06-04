import { useState, useCallback, useMemo } from "react";
import {
  Subscription,
  getPlatformDomain,
  getLogoDevUrl,
  getDuckDuckGoLogoUrl,
  getGoogleFaviconUrl,
} from "../data/subscriptions";

const LOGO_DEV_PUBLISHABLE_KEY = import.meta.env.VITE_LOGODEV_PUBLISHABLE_KEY as string | undefined;

// Cache logo sources to avoid recalculating on every render
const logoSourcesCache = new Map<string, string[]>();

export function usePlatformLogo() {
  const [logoFallbackStage, setLogoFallbackStage] = useState<Record<string, number>>({});

  const getPlatformLogoSources = useCallback((platform: string, preferredDomain?: string) => {
    const cacheKey = `${platform}:${preferredDomain || ""}`;

    // Return cached sources if available
    if (logoSourcesCache.has(cacheKey)) {
      return logoSourcesCache.get(cacheKey)!;
    }

    const domain = getPlatformDomain(platform, preferredDomain);
    const sources = [
      getLogoDevUrl(domain, LOGO_DEV_PUBLISHABLE_KEY),
      getDuckDuckGoLogoUrl(domain),
      getGoogleFaviconUrl(domain),
    ].filter(Boolean);

    // Cache the sources for future use
    logoSourcesCache.set(cacheKey, sources);
    return sources;
  }, []);

  const handleLogoError = useCallback((platformId: string, platform: string, logoDomain?: string) => {
    const sources = getPlatformLogoSources(platform, logoDomain);
    setLogoFallbackStage((prev) => {
      const currentStage = prev[platformId] ?? 0;
      if (currentStage >= sources.length - 1) {
        return {
          ...prev,
          [platformId]: sources.length,
        };
      }
      return {
        ...prev,
        [platformId]: currentStage + 1,
      };
    });
  }, [getPlatformLogoSources]);

  const getActiveLogoSrc = useCallback((subscription: Subscription) => {
    const sources = getPlatformLogoSources(subscription.platform, subscription.logoDomain);
    const stage = logoFallbackStage[subscription.id] ?? 0;
    if (stage >= sources.length) {
      return "";
    }
    return sources[stage] || "";
  }, [logoFallbackStage, getPlatformLogoSources]);

  return {
    getActiveLogoSrc,
    handleLogoError,
  };
}
