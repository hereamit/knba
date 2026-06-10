"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import type { HTMLFlipBookRef } from "react-pageflip";

type RenderedPage = { url: string; width: number; height: number };
type Dimensions = { w: number; h: number };

// Largest a single page is allowed to get on big screens.
const MAX_PAGE_WIDTH = 820;
const MAX_PAGE_HEIGHT = 720;

// Each child of HTMLFlipBook must forward its ref to a DOM node so the
// page-flip engine can measure and animate it.
const FlipPage = forwardRef<HTMLDivElement, { src: string; pageNumber: number }>(
  function FlipPage({ src, pageNumber }, ref) {
    return (
      <div ref={ref} className="overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`Calendar page ${pageNumber}`}
          className="h-full w-full select-none object-contain"
          draggable={false}
        />
      </div>
    );
  },
);

export function CalendarFlipbook({ pdfUrl }: { pdfUrl: string }) {
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [currentPage, setCurrentPage] = useState(0);
  const [dims, setDims] = useState<Dimensions | null>(null);
  const bookRef = useRef<HTMLFlipBookRef | null>(null);
  const outerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderPdf = async () => {
      setStatus("loading");
      setPages([]);
      setCurrentPage(0);
      setDims(null);

      try {
        const pdfjs = await import("pdfjs-dist");
        // Worker is served same-origin from /public (copied at install time).
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf = await pdfjs.getDocument({ url: pdfUrl }).promise;
        const rendered: RenderedPage[] = [];

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (cancelled) {
            return;
          }
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvas, viewport }).promise;
          rendered.push({
            url: canvas.toDataURL("image/jpeg", 0.85),
            width: viewport.width,
            height: viewport.height,
          });
        }

        if (!cancelled) {
          setPages(rendered);
          setStatus(rendered.length ? "ready" : "error");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    };

    void renderPdf();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  // Size a single page to the available width (responsive), capped so the
  // page-flip engine always stays in single-page (portrait) mode.
  useEffect(() => {
    if (status !== "ready" || pages.length === 0) {
      return;
    }
    const aspect = pages[0].width / pages[0].height;

    const compute = () => {
      const available = outerRef.current?.clientWidth ?? MAX_PAGE_WIDTH;
      let w = Math.min(available, MAX_PAGE_WIDTH);
      let h = w / aspect;
      if (h > MAX_PAGE_HEIGHT) {
        h = MAX_PAGE_HEIGHT;
        w = h * aspect;
      }
      const next = { w: Math.round(w), h: Math.round(h) };
      setDims((prev) =>
        prev && Math.abs(prev.w - next.w) <= 1 && Math.abs(prev.h - next.h) <= 1
          ? prev
          : next,
      );
    };

    compute();
    const observer = new ResizeObserver(compute);
    if (outerRef.current) {
      observer.observe(outerRef.current);
    }
    return () => observer.disconnect();
  }, [status, pages]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[24rem] items-center justify-center rounded-[1.6rem] border border-line bg-white">
        <p className="text-sm font-medium text-muted">Rendering calendar pages…</p>
      </div>
    );
  }

  if (status === "error" || pages.length === 0) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-[1.6rem] border border-amber-200 bg-amber-50 px-6 text-center">
        <p className="text-sm font-medium text-amber-700">
          The calendar preview could not be loaded. You can still download the PDF below.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div ref={outerRef} className="w-full">
        <div
          className="mx-auto overflow-hidden"
          style={{ maxWidth: dims ? dims.w : MAX_PAGE_WIDTH }}
        >
          {dims ? (
            <HTMLFlipBook
              key={`${dims.w}x${dims.h}`}
              ref={bookRef}
              width={dims.w}
              height={dims.h}
              size="fixed"
              usePortrait
              showCover={false}
              mobileScrollSupport
              useMouseEvents
              drawShadow
              maxShadowOpacity={0.4}
              flippingTime={600}
              startPage={currentPage}
              className="calendar-flipbook"
              style={{}}
              onFlip={(event) => setCurrentPage(event.data)}
            >
              {pages.map((page, index) => (
                <FlipPage key={page.url} src={page.url} pageNumber={index + 1} />
              ))}
            </HTMLFlipBook>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => bookRef.current?.pageFlip().flipPrev()}
          disabled={currentPage <= 0}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-xl text-primary shadow-sm transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          {"←"}
        </button>
        <p className="min-w-[6.5rem] text-center text-sm font-semibold text-muted">
          Page {Math.min(currentPage + 1, pages.length)} / {pages.length}
        </p>
        <button
          type="button"
          onClick={() => bookRef.current?.pageFlip().flipNext()}
          disabled={currentPage >= pages.length - 1}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-xl text-primary shadow-sm transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          {"→"}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">Swipe or drag the pages to turn them.</p>
    </div>
  );
}
