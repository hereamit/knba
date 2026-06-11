declare module "react-pageflip" {
  import type {
    CSSProperties,
    ForwardRefExoticComponent,
    PropsWithChildren,
    RefAttributes,
  } from "react";

  export interface PageFlipApi {
    flipNext: (corner?: "top" | "bottom") => void;
    flipPrev: (corner?: "top" | "bottom") => void;
    flip: (page: number, corner?: "top" | "bottom") => void;
    turnToPage: (page: number) => void;
    getCurrentPageIndex: () => number;
    getPageCount: () => number;
  }

  export interface HTMLFlipBookRef {
    pageFlip: () => PageFlipApi;
  }

  export interface HTMLFlipBookProps {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
    startPage?: number;
    className?: string;
    style?: CSSProperties;
    onFlip?: (event: { data: number }) => void;
    onChangeState?: (event: { data: string }) => void;
    onChangeOrientation?: (event: { data: string }) => void;
    onInit?: (event: unknown) => void;
  }

  const HTMLFlipBook: ForwardRefExoticComponent<
    PropsWithChildren<HTMLFlipBookProps> & RefAttributes<HTMLFlipBookRef>
  >;

  export default HTMLFlipBook;
}
