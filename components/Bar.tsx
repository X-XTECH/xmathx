'use client';
import { useEffect, useRef } from 'react';

/**
 * A progress bar whose fill is set through the CSSOM, never a style attribute.
 * The markup carries no inline style, so the Content Security Policy allows no inline styles at all.
 */
export default function Bar({ value, className = 'bar' }: { value: number; className?: string }) {
  const fill = useRef<HTMLElement>(null);
  useEffect(() => {
    fill.current?.style.setProperty('--p', String(Math.max(0, Math.min(1, value))));
  }, [value]);
  return <div className={className} aria-hidden="true"><i ref={fill} /></div>;
}
