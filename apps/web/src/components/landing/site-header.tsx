"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@sellora/ui/components/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@sellora/ui/components/sheet";
import { t } from "@sellora/shared/i18n";
import { cn } from "@sellora/ui/utils";

const links = [
  { href: "#como-funciona", label: t("nav.how") },
  { href: "#privacidad", label: t("nav.privacy") },
  { href: "#preguntas", label: t("nav.faq") },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Inicio" className="rounded-lg">
          <Logo className="h-8" />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "hidden sm:inline-flex")}
          >
            {t("common.login")}
          </Link>
          <Link href="/registro" className={cn(buttonVariants({ size: "lg" }), "rounded-full px-4")}>
            {t("common.createCard")}
          </Link>

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label={t("common.toggleMenu")}
                />
              }
            >
              <MenuIcon className="size-5" />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menú</SheetTitle>
              </SheetHeader>
              <nav aria-label="Móvil" className="flex flex-col gap-1 px-4">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="rounded-xl px-3 py-3 text-lg font-medium hover:bg-muted"
                  >
                    {l.label}
                  </a>
                ))}
                <Link href="/login" className="rounded-xl px-3 py-3 text-lg font-medium hover:bg-muted">
                  {t("common.login")}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
