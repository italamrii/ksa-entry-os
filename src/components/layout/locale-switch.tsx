"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { switchLocalePath, getLocaleFromSearch } from "@/lib/i18n/locale-utils";
import { cn } from "@/lib/utils";

/**
 * The canonical language switcher. Stays on the CURRENT route: pathname,
 * query parameters, and hash fragment are preserved; only `lang` changes.
 * Client-side so it can read the live URL — the server-rendered header cannot
 * know which page it is on, which is why a server-side switcher degenerated
 * into a landing-page link.
 */
function LocaleSwitchInner() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const locale = getLocaleFromSearch(params.get("lang"));
  const target = locale === "ar" ? "en" : "ar";
  const href = switchLocalePath(pathname, params.toString(), "", target);

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        // The hash only exists in the browser at click time (it is never sent
        // to the server), so resolve it here to keep `#section` anchors.
        router.push(switchLocalePath(pathname, params.toString(), window.location.hash, target));
      }}
      className={cn(
        "rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-semibold transition",
        "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--highlight)]"
      )}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      lang={locale === "ar" ? "en" : "ar"}
    >
      {locale === "ar" ? "EN" : "عربي"}
    </a>
  );
}

export function LocaleSwitch() {
  return (
    <Suspense fallback={null}>
      <LocaleSwitchInner />
    </Suspense>
  );
}
