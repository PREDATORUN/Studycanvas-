import type { HTMLAttributes } from "react";

/** Server-compatible material primitive. The shared renderer enhances it after hydration. */
export function LiquidGlassSurface({
  as: Tag = "div",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "header" | "aside";
}) {
  return (
    <Tag {...props} className={`liquid-glass ${className}`}>
      {children}
    </Tag>
  );
}

export function LiquidGlassCard(props: HTMLAttributes<HTMLElement>) {
  return (
    <LiquidGlassSurface
      as="section"
      {...props}
      className={`card ${props.className ?? ""}`}
    />
  );
}
