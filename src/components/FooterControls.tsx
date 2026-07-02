"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useLang } from "@/context/LanguageContext";

// Controles discretos del pie: idioma (ES/EN) y tema (auto/claro/oscuro).
// Chiquitos y apagados a propósito — están para quien los busca, sin competir
// con la tienda. (El toggle de tema salió del header por pedido del dueño.)

function Seg({ active, onClick, children, label }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`rounded-[3px] px-2 py-1 text-[11px] font-medium transition ${
        active
          ? "bg-fill/10 text-ink"
          : "text-ink-muted hover:text-ink-soft"
      }`}
    >
      {children}
    </button>
  );
}

export default function FooterControls() {
  const { lang, setLang, t } = useLang();
  const { pref, setTheme } = useTheme();
  // Evita desajuste de hidratación: idioma/tema reales recién tras montar.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-7" aria-hidden="true" />;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Idioma */}
      <div className="flex items-center gap-0.5 rounded-[4px] border border-line/10 p-0.5">
        <Seg active={lang === "es"} onClick={() => setLang("es")} label="Español">
          ES
        </Seg>
        <Seg active={lang === "en"} onClick={() => setLang("en")} label="English">
          EN
        </Seg>
      </div>

      {/* Tema */}
      <div className="flex items-center gap-0.5 rounded-[4px] border border-line/10 p-0.5">
        <Seg
          active={pref === "system"}
          onClick={() => setTheme("system")}
          label={t("ctrl.theme.auto")}
        >
          {/* Monitor (auto) */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="13" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </Seg>
        <Seg
          active={pref === "light"}
          onClick={() => setTheme("light")}
          label={t("ctrl.theme.light")}
        >
          {/* Sol */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </Seg>
        <Seg
          active={pref === "dark"}
          onClick={() => setTheme("dark")}
          label={t("ctrl.theme.dark")}
        >
          {/* Luna */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
        </Seg>
      </div>
    </div>
  );
}
