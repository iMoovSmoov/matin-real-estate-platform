"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-white py-20 text-center">
      <Container className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <span className="eyebrow">Unexpected error</span>
          <div className="rule-accent mx-auto" />
        </div>

        <h1 className="display-2 max-w-lg text-balance text-ink">
          Something went wrong
        </h1>

        <p className="max-w-md text-base leading-relaxed text-slate sm:text-lg">
          An unexpected error occurred. Please try again — if the problem
          persists, contact us and we&apos;ll get it sorted.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" size="lg" onClick={reset}>
            Try again
          </Button>
          <ButtonLink href="/" variant="outline" size="lg">
            Go home
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
