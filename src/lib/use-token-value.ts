"use client";

import { useCallback, useSyncExternalStore } from "react";
import { resolveTokenValue } from "@/lib/tokens";

/**
 * useTokenValue — read the *computed* value of a design token after hydration.
 *
 * A custom property is resolved from the document, which is browser-only state, so
 * the read happens through `useSyncExternalStore`: the server snapshot is empty and
 * the client re-renders with the real value. This keeps the read out of the render
 * body and out of a synchronous effect.
 *
 * Values are cached because colour and gradient tokens do not change after load.
 * (Motion duration tokens DO change with `prefers-reduced-motion`; read those live
 * instead — see MotionLab.)
 */
const cache = new Map<string, string>();

function readCached(token: string, property: string): string {
  const key = `${property}|${token}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const value = resolveTokenValue(token, property);
  cache.set(key, value);
  return value;
}

/** Static tokens never change, so there is nothing to subscribe to. */
const subscribe = () => () => {};

const getServerSnapshot = () => "";

export function useTokenValue(token: string, property = "color"): string {
  const getSnapshot = useCallback(() => readCached(token, property), [token, property]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
