"use client";
import { useRef } from "react";
import { usePageMotion } from "../lib/use-page-motion";
export function PageTransition({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  usePageMotion(root);
  return (
      <div ref={root} className="page-content">
        {children}
      </div>
  );
}
