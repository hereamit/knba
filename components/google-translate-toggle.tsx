"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          options: Record<string, string | boolean>,
          elementId: string,
        ) => unknown;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

const STORAGE_KEY = "knba_site_lang";

function applyLanguage(language: "en" | "ne", attempt = 0) {
  const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;

  if (!combo) {
    if (attempt < 12) {
      window.setTimeout(() => applyLanguage(language, attempt + 1), 250);
    }
    return;
  }

  combo.value = language;
  combo.dispatchEvent(new Event("change"));
}

export function GoogleTranslateToggle() {
  const [language, setLanguage] = useState<"en" | "ne">("en");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedLanguage =
      (window.localStorage.getItem(STORAGE_KEY) as "en" | "ne" | null) ?? "en";

    if (storedLanguage !== "en") {
      window.setTimeout(() => {
        setLanguage(storedLanguage);
      }, 0);
    }

    window.googleTranslateElementInit = () => {
      const mountNode = document.getElementById("google_translate_element");
      if (!mountNode || mountNode.childNodes.length > 0 || !window.google?.translate) {
        return;
      }

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,ne",
          autoDisplay: false,
        },
        "google_translate_element",
      );

      applyLanguage(storedLanguage);
    };

    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      window.googleTranslateElementInit = undefined;
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const setSiteLanguage = (nextLanguage: "en" | "ne") => {
    setLanguage(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    applyLanguage(nextLanguage);
  };

  return (
    <>
      <div
        id="google_translate_element"
        className="pointer-events-none absolute -left-[9999px] top-auto opacity-0"
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className={`fixed right-0 top-24 z-40 transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-[calc(100%-2.25rem)]"
        }`}
      >
        <div className="flex overflow-hidden rounded-l-[1.2rem] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(18,31,69,0.14)]">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex w-9 items-center justify-center bg-[linear-gradient(180deg,#273c75,#1e3799)] text-[10px] font-bold uppercase tracking-[0.12em] text-white [writing-mode:vertical-rl]"
            aria-label="Open translation options"
          >
            Translate
          </button>

          <div className="w-56 p-3.5">
            <p className="text-sm font-bold text-slate-800">Site Language</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Switch the public website between English and Nepali.
            </p>

            <div className="mt-3 rounded-full bg-[#eaf0ff] p-1">
              <div className="relative grid grid-cols-2">
                <span
                  className={`absolute inset-y-0 left-0 w-1/2 rounded-full bg-[linear-gradient(135deg,#273c75,#1e3799)] shadow-[0_10px_24px_rgba(30,55,153,0.2)] transition-transform duration-300 ${
                    language === "ne" ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setSiteLanguage("en")}
                  className={`relative z-10 rounded-full px-3 py-2 text-xs font-bold transition ${
                    language === "en" ? "text-white" : "text-primary"
                  }`}
                >
                  ENG
                </button>
                <button
                  type="button"
                  onClick={() => setSiteLanguage("ne")}
                  className={`relative z-10 rounded-full px-3 py-2 text-xs font-bold transition ${
                    language === "ne" ? "text-white" : "text-primary"
                  }`}
                >
                  NPL
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
