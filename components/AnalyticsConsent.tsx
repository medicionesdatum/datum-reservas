"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const CONSENT_STORAGE_KEY = "datum-analytics-consent-v1";

type AnalyticsConsentChoice = "granted" | "denied";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function isPrivateRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/confirmacion";
}

function clearGoogleAnalyticsCookies() {
  const cookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter((name) => name === "_gid" || name === "_gat" || name.startsWith("_ga"));

  for (const name of cookieNames) {
    const expiredCookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = expiredCookie;
    document.cookie = `${expiredCookie}; domain=${window.location.hostname}`;
    document.cookie = `${expiredCookie}; domain=.${window.location.hostname}`;
  }
}

export function AnalyticsConsent({ gaId }: { gaId?: string }) {
  const pathname = usePathname();
  const [choice, setChoice] = useState<AnalyticsConsentChoice | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isBannerOpen, setIsBannerOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedChoice = window.localStorage.getItem(CONSENT_STORAGE_KEY);
        if (storedChoice === "granted" || storedChoice === "denied") {
          setChoice(storedChoice);
        } else {
          setIsBannerOpen(true);
        }
      } catch {
        setIsBannerOpen(true);
      } finally {
        setIsReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function saveChoice(nextChoice: AnalyticsConsentChoice) {
    if (nextChoice === "denied") {
      window.gtag?.("consent", "update", {
        ad_personalization: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        analytics_storage: "denied"
      });
      clearGoogleAnalyticsCookies();
    }

    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, nextChoice);
    } catch {
      // The choice still applies for the current page when storage is unavailable.
    }

    setChoice(nextChoice);
    setIsBannerOpen(false);
  }

  if (!gaId || !isReady || isPrivateRoute(pathname)) {
    return null;
  }

  return (
    <>
      {choice === "granted" ? <GoogleAnalytics gaId={gaId} /> : null}

      {isBannerOpen ? (
        <aside
          aria-labelledby="datum-cookie-title"
          aria-live="polite"
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-4xl rounded-xl border border-datum-cyan/50 bg-[#06111f] p-5 shadow-2xl shadow-black/50 sm:inset-x-6 sm:p-6"
          role="dialog"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-white" id="datum-cookie-title">
                Cookies estadísticas
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Usamos Google Analytics únicamente con tu permiso para conocer el uso general de la web y mejorarla. No enviamos a Google los datos que introduces en la reserva.
              </p>
              <Link
                className="mt-2 inline-flex text-sm font-semibold text-datum-cyan underline decoration-datum-cyan/50 underline-offset-4 hover:text-cyan-200"
                href="/privacidad#cookies-estadisticas"
              >
                Más información
              </Link>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row md:shrink-0">
              <button
                className="min-h-11 rounded-md border border-slate-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
                onClick={() => saveChoice("denied")}
                type="button"
              >
                Rechazar
              </button>
              <button
                className="min-h-11 rounded-md bg-datum-cyan px-5 py-2.5 text-sm font-semibold text-datum-ink transition hover:bg-cyan-200"
                onClick={() => saveChoice("granted")}
                type="button"
              >
                Aceptar estadísticas
              </button>
            </div>
          </div>
        </aside>
      ) : (
        <button
          aria-label="Configurar cookies estadísticas"
          className="fixed bottom-3 left-3 z-[90] min-h-10 rounded-full border border-datum-line bg-[#06111f] px-4 py-2 text-xs font-semibold text-slate-200 shadow-lg shadow-black/30 transition hover:border-datum-cyan hover:text-datum-cyan"
          onClick={() => setIsBannerOpen(true)}
          type="button"
        >
          Cookies
        </button>
      )}
    </>
  );
}
