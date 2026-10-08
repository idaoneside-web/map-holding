"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import {
  HERO_FRAGMENT_SHADER,
  HERO_MAX_PIXELS,
  HERO_MAX_STEPS,
  HERO_MIN_STEPS,
  HERO_VERTEX_SHADER,
} from "./hero-shader";
import { Hero3DFallback } from "./Hero3DFallback";
import styles from "./Hero3D.module.css";

export interface Hero3DProps {
  className?: string;
  /**
   * Composition time (seconds) used for the single frame rendered when
   * `prefers-reduced-motion: reduce` is set, chosen so the frozen pose is
   * visually balanced.
   */
  stillTime?: number;
}

type HeroState = "static" | "running" | "reduced" | "fallback";

/**
 * Hero3D — the experimental 3D brand hero (Phase 3 §7–§10).
 *
 * The static `Hero3DFallback` is always rendered first and is the LCP element.
 * Everything below happens on the client, after mount, and is entirely
 * optional: if WebGL2 is missing, if the context is lost, or if the shader
 * fails to compile, the page simply keeps the static visual. The website never
 * depends on 3D to be usable.
 *
 * Lifecycle:
 *   mount → observe the hero → when visible, defer to an idle callback →
 *   create the canvas + context → compile → paint → crossfade in.
 *
 * `data-hero3d-state` on the host element reports the outcome; it is what the
 * validation harness asserts against.
 */
export function Hero3D({ className, stillTime = 7.4 }: Hero3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hostEl = hostRef.current;
    if (!hostEl) return;
    /* Narrowed to non-null for the closures below: TypeScript does not carry
       control-flow narrowing into hoisted function declarations. */
    const host: HTMLDivElement = hostEl;

    /* --- Mutable render state. Deliberately not React state: the canvas must
       never trigger a re-render, and the data attributes below are written
       imperatively. ------------------------------------------------------- */
    let disposed = false;
    let started = false;
    let canvas: HTMLCanvasElement | null = null;
    let gl: WebGL2RenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let uniforms: Record<string, WebGLUniformLocation | null> = {};
    let rafId = 0;
    let lastFrame = 0;
    let frameCount = 0;
    let dtAvg = 0;
    let revealed = 0;
    let quality = 0.72;
    let steps = HERO_MAX_STEPS;
    let startTime = 0;
    let visible = false;
    let cancelPendingInit: (() => void) | null = null;
    /* Pointer parallax. `mouse` is the eased value actually uploaded; `mouseT`
       is the raw target from the last pointer event. Keeping them apart lets the
       camera glide toward the pointer instead of snapping to it. */
    let mouseX = 0;
    let mouseY = 0;
    let mouseTX = 0;
    let mouseTY = 0;
    /* Scroll scrub. `scrollP` is the eased value uploaded to the shader; `scrollT`
       is the raw target derived from the pinned stage's position. Easing keeps
       the scrub smooth and slightly trailing the scroll wheel. */
    let scrollP = 0;
    let scrollT = 0;

    const reducedMotion =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    function setState(state: HeroState) {
      host.dataset.hero3dState = state;
    }

    function compile(type: number, source: string): WebGLShader | null {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        // A failed shader is non-fatal: the static fallback stays.
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    function setup(): boolean {
      canvas = document.createElement("canvas");
      canvas.className = styles.canvas;
      canvas.setAttribute("aria-hidden", "true");
      canvas.width = 1;
      canvas.height = 1;

      /* alpha:true so the canvas can crossfade over the static fallback;
         no depth or stencil buffers, because the scene is raymarched in one
         full-screen triangle and draws no geometry. */
      gl = canvas.getContext("webgl2", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
      });
      if (!gl) return false;

      const vs = compile(gl.VERTEX_SHADER, HERO_VERTEX_SHADER);
      const fs = compile(gl.FRAGMENT_SHADER, HERO_FRAGMENT_SHADER);
      if (!vs || !fs) return false;

      program = gl.createProgram();
      if (!program) return false;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        program = null;
        return false;
      }
      gl.useProgram(program);

      /* One oversized triangle covering the viewport — cheaper than a quad. */
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const attrib = gl.getAttribLocation(program, "aPos");
      gl.enableVertexAttribArray(attrib);
      gl.vertexAttribPointer(attrib, 2, gl.FLOAT, false, 0, 0);

      uniforms = {
        resolution: gl.getUniformLocation(program, "uResolution"),
        time: gl.getUniformLocation(program, "uTime"),
        steps: gl.getUniformLocation(program, "uSteps"),
        reveal: gl.getUniformLocation(program, "uReveal"),
        mouse: gl.getUniformLocation(program, "uMouse"),
        scroll: gl.getUniformLocation(program, "uScroll"),
      };
      return true;
    }

    function resize() {
      if (!gl || !canvas) return;
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      let w = Math.max(1, Math.round(rect.width * dpr * quality));
      let h = Math.max(1, Math.round(rect.height * dpr * quality));

      /* Absolute pixel budget: a 4K display must not cost 4K of raymarching. */
      const pixels = w * h;
      if (pixels > HERO_MAX_PIXELS) {
        const k = Math.sqrt(HERO_MAX_PIXELS / pixels);
        w = Math.max(1, Math.round(w * k));
        h = Math.max(1, Math.round(h * k));
      }

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    }

    function paint(time: number) {
      if (!gl || !canvas) return;
      gl.uniform2f(uniforms.resolution ?? null, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time ?? null, time);
      gl.uniform1i(uniforms.steps ?? null, steps);
      gl.uniform1f(uniforms.reveal ?? null, revealed);
      gl.uniform2f(uniforms.mouse ?? null, mouseX, mouseY);
      gl.uniform1f(uniforms.scroll ?? null, scrollP);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    /* --- Adaptive quality: one-way degradation only. If frames are slow,
       spend less on each one rather than stuttering. -------------------- */
    function adapt() {
      if (dtAvg > 26 && (steps > HERO_MIN_STEPS || quality > 0.45)) {
        steps = Math.max(HERO_MIN_STEPS, Math.round(steps * 0.75));
        quality = Math.max(0.45, quality * 0.85);
        // Observability: expose the live quality so degradation is inspectable
        // rather than invisible. Written only when it changes.
        host.dataset.hero3dSteps = String(steps);
        host.dataset.hero3dScale = quality.toFixed(2);
        resize();
      }
    }

    function loop(now: number) {
      rafId = 0;
      if (disposed || !gl || !visible) return;
      if (startTime === 0) startTime = now;
      if (lastFrame > 0) dtAvg = dtAvg * 0.9 + (now - lastFrame) * 0.1;
      lastFrame = now;

      if (++frameCount % 30 === 0) adapt();

      if (revealed < 1) {
        revealed = Math.min(1, revealed + 0.06);
        if (revealed >= 1) host.dataset.hero3dReveal = "1";
      }

      /* Ease the camera toward the pointer target. A low factor keeps the
         response slow and heavy — cinematic, not twitchy. The scroll scrub is
         eased the same way so the turn trails the wheel slightly. */
      mouseX += (mouseTX - mouseX) * 0.045;
      mouseY += (mouseTY - mouseY) * 0.045;
      scrollP += (scrollT - scrollP) * 0.12;
      host.dataset.hero3dScroll = scrollP.toFixed(2);

      paint((now - startTime) / 1000);
      rafId = requestAnimationFrame(loop);
    }

    function resume() {
      if (disposed || rafId || !gl || !visible) return;
      lastFrame = 0;
      rafId = requestAnimationFrame(loop);
    }

    function pause() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      startTime = 0;
    }

    /* --- Context loss is survivable: stop, and let the static fallback show. */
    function onContextLost(event: Event) {
      event.preventDefault();
      pause();
      setState("fallback");
    }

    /* --- Reduced-motion changes can happen at any time (OS toggle). ------- */
    function onReducedMotionChange() {
      if (!started || !gl) return;
      if (reducedMotion && reducedMotion.matches) {
        pause();
        revealed = 1;
        // Return the camera to its canonical pose so the still frame is the
        // approved composition, not wherever the pointer last left it.
        mouseX = 0;
        mouseY = 0;
        mouseTX = 0;
        mouseTY = 0;
        paint(stillTime);
        setState("reduced");
      } else {
        setState("running");
        resume();
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") pause();
      else resume();
    }

    /* Pointer parallax target. Normalised to [-1, 1] with the origin at the
       viewport centre, matching uMouse's contract in the shader. */
    function onPointerMove(event: PointerEvent) {
      /* While motion is suppressed the still frame must not move, so the target
         is frozen — the eased value simply never receives an update. */
      if (reducedMotion && reducedMotion.matches) return;
      mouseTX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseTY = 1 - (event.clientY / window.innerHeight) * 2;
    }

    /* Scroll scrub target. Progress runs 0 -> 1 across the pinned stage's
       runway (stage height minus one viewport), measured from the stage's own
       geometry, so Hero3D needs no knowledge of the page layout beyond the
       `[data-hero-stage]` hook. When there is no such ancestor — e.g. the client
       portal hero — progress stays 0 and the behaviour is exactly as before. */
    function updateScrollTarget() {
      if (reducedMotion && reducedMotion.matches) {
        scrollT = 0;
        return;
      }
      const stage = host.closest("[data-hero-stage]") as HTMLElement | null;
      if (!stage) {
        scrollT = 0;
        return;
      }
      const rect = stage.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      scrollT = total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 0;
    }

    /* rAF-throttled: scroll events can fire faster than frames, so coalesce. */
    let scrollQueued = false;
    function onScroll() {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        updateScrollTarget();
      });
    }

    /* --- Init: create the canvas and context, lazily. --------------------- */
    function init() {
      cancelPendingInit = null;
      if (started || disposed) return;
      started = true;
      const layer = canvasLayerRef.current;

      if (!setup() || !layer) {
        // No WebGL2, or the program failed to build. Not an error state.
        setState("fallback");
        return;
      }

      /* The canvas goes into its own layer, which sits ABOVE the static fallback
         but BELOW the legibility scrim. Appending it to the host instead would
         place it above the scrim and the hero text would lose its contrast
         backing — which is exactly the defect this layering fixes. */
      layer.append(canvas as HTMLCanvasElement);
      (canvas as HTMLCanvasElement).addEventListener("webglcontextlost", onContextLost);
      resize();

      /* Reduced motion: paint exactly ONE frame and never animate. */
      if (reducedMotion && reducedMotion.matches) {
        revealed = 1;
        paint(stillTime);
        setState("reduced");
        return;
      }

      /* Paint a transparent first frame, then hand over to the loop, which
         fades alpha in over the static fallback. */
      revealed = 0;
      paint(0);
      setState("running");
      resume();
    }

    function scheduleInit() {
      const idle = window.requestIdleCallback;
      const cancelIdle = window.cancelIdleCallback;
      if (typeof idle === "function" && typeof cancelIdle === "function") {
        const id = idle(() => init(), { timeout: 1500 });
        cancelPendingInit = () => cancelIdle(id);
      } else {
        const id = window.setTimeout(init, 200);
        cancelPendingInit = () => window.clearTimeout(id);
      }
    }

    /* --- Wiring ----------------------------------------------------------- */

    const intersection = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible = entry.isIntersecting;
          if (!visible) pause();
          else if (!started) scheduleInit();
          else resume();
        }
      },
      { rootMargin: "200px" },
    );
    intersection.observe(host);

    const resizeObserver = new ResizeObserver(() => {
      if (!started || !gl) return;
      resize();
      // A still frame must survive a resize, since no loop will repaint it.
      if (reducedMotion && reducedMotion.matches) paint(stillTime);
    });
    resizeObserver.observe(host);

    /* Pointer parallax is a fine-pointer affordance: on touch there is no hover,
       so listening would only make the camera lurch during a scroll. */
    const finePointer =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(pointer: fine)").matches
        : false;
    if (finePointer) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateScrollTarget();

    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion?.addEventListener("change", onReducedMotionChange);

    return () => {
      disposed = true;
      pause();
      cancelPendingInit?.();
      intersection.disconnect();
      resizeObserver.disconnect();
      if (finePointer) window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion?.removeEventListener("change", onReducedMotionChange);

      if (canvas) {
        canvas.removeEventListener("webglcontextlost", onContextLost);
        canvas.remove();
      }
      // Explicitly release the GPU context so StrictMode's double-mount cannot
      // accumulate contexts and hit the browser's per-page context limit.
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      gl = null;
      canvas = null;
      program = null;
    };
  }, [stillTime]);

  return (
    <div
      ref={hostRef}
      className={cn(styles.hero, className)}
      data-hero3d-state="static"
      data-hero3d-tech="webgl2-sdf-raymarch"
      /* Purely atmospheric: the hero's heading and copy carry all meaning. */
      aria-hidden="true"
    >
      <Hero3DFallback />
      {/* The canvas is appended here at runtime, so it sits above the fallback
          and below the scrim regardless of when it is created. */}
      <div ref={canvasLayerRef} className={styles.canvasLayer} />
      {/* Legibility scrim. Deliberately ABOVE the 3D layer: the shader's glow is
          the brightest thing on the page, and without a layer above it the hero
          text has no contrast backing. Measured effect and weights in the CSS. */}
      <span className={styles.scrim} />
    </div>
  );
}
