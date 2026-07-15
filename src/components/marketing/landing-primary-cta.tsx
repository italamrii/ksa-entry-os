"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

/**
 * Landing primary CTA with a visible pending state during client navigation.
 */
export function LandingPrimaryCta({
  href,
  label,
  locale,
}: {
  href: string;
  label: string;
  locale: Locale;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const pendingLabel = locale === "ar" ? "جاري التوجيه…" : "Redirecting…";

  return (
    <Button
      type="button"
      size="lg"
      className="cta-glow w-full gap-2 sm:w-auto"
      disabled={pending}
      aria-busy={pending}
      onClick={() => {
        startTransition(() => {
          router.push(href);
        });
      }}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        <>
          {label}
          <Arrow className="h-4 w-4" aria-hidden />
        </>
      )}
    </Button>
  );
}
