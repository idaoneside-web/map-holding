"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import {
  STORY_FRAGMENT_SHADER,
  STORY_MAX_PIXELS,
  STORY_MAX_STEPS,
  STORY_MIN_STEPS,
  STORY_VERTEX_SHADER,
} from "./scroll-story";
import styles from "./ScrollStory.module.css";

export interface ScrollStoryProps {
  className?: string;
}

type StoryState = "static" | "running" | "reduced" | "fallback";

/**
 * ScrollStory — the cinematic scroll journey stage.
 *
 * A single fixed, full-viewport WebGL2 canvas that persists behind the whole
 * homepage, so the experience is one continuous world rather than per-section
 * cards. The only thing that drives the world is scroll: `uProgress` is the
 * document's scroll fraction, mapped by the shader across nine business beats.
 *
 * Graceful by construction (Phase 3 §10):
 *  - a server-rendered poster sits underneath and is the LCP element;
 *  - the canvas is created lazily and only once, over the poster;
 *  - quality degrades one-way if frames are slow;
 *  - the loop pauses when the tab is hidden;
 *  - `prefers-reduced-motion: reduce` freezes time (no autoplay) and drops the
 *    pointer parallax, but still follows scroll, so the journey is legible as
 *    low motion;
 *  - if WebGL2 is missing the poster + per-section CSS tints carry the page.
 *
 * `data-story-state` reports the outcome for inspection.
 */
export function ScrollStory({ className }: ScrollStoryProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hostEl = hostRef.current;
    if (!hostEl) return;
    const host: HTMLDivElement = hostEl;

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
    let quality = 0.7;
    let steps = STORY_MAX_STEPS;
    let elapsed = 0;
    let progress = 0;
    let progressTarget = 0;
    let mouseX = 0, mouseY = 0, mouseTX = 0, mouseTY = 0;
    let visible = true;
    let cancelPendingInit: (() => void) | null = null;

    const reducedMotion =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    function setState(state: StoryState) {
      host.dataset.storyState = state;
    }

    function compile(type: number, source: string): WebGLShader | null {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
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
      gl = canvas.getContext("webgl2", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
      });
      if (!gl) return false;

      const vs = compile(gl.VERTEX_SHADER, STORY_VERTEX_SHADER);
      const fs = compile(gl.FRAGMENT_SHADER, STORY_FRAGMENT_SHADER);
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

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const attrib = gl.getAttribLocation(program, "aPos");
      gl.enableVertexAttribArray(attrib);
      gl.vertexAttribPointer(attrib, 2, gl.FLOAT, false, 0, 0);

      uniforms = {
        resolution: gl.getUniformLocation(program, "uResolution"),
        time: gl.getUniformLocation(program, "uTime"),
        progress: gl.getUniformLocation(program, "uProgress"),
        steps: gl.getUniformLocation(program, "uSteps"),
        reveal: gl.getUniformLocation(program, "uReveal"),
        mouse: gl.getUniformLocation(program, "uMouse"),
      };
      return true;
    }

    function resize() {
      if (!gl || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      let w = Math.max(1, Math.round(window.innerWidth * dpr * quality));
      let h = Math.max(1, Math.round(window.innerHeight * dpr * quality));
      const pixels = w * h;
      if (pixels > STORY_MAX_PIXELS) {
        const k = Math.sqrt(STORY_MAX_PIXELS / pixels);
        w = Math.max(1, Math.round(w * k));
        h = Math.max(1, Math.round(h * k));
      }
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    }

    function paint() {
      if (!gl || !canvas) return;
      gl.uniform2f(uniforms.resolution ?? null, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time ?? null, reducedMotion && reducedMotion.matches ? 0.0 : elapsed);
      gl.uniform1f(uniforms.progress ?? null, progress);
      gl.uniform1i(uniforms.steps ?? null, steps);
      gl.uniform1f(uniforms.reveal ?? null, revealed);
      gl.uniform2f(uniforms.mouse ?? null, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function adapt() {
      if (dtAvg > 28 && (steps > STORY_MIN_STEPS || quality > 0.45)) {
        steps = Math.max(STORY_MIN_STEPS, Math.round(steps * 0.75));
        quality = Math.max(0.45, quality * 0.85);
        host.dataset.storySteps = String(steps);
        host.dataset.storyScale = quality.toFixed(2);
        resize();
      }
    }

    function loop(now: number) {
      rafId = 0;
      if (disposed || !gl || !visible) return;
      if (lastFrame > 0) {
        const dt = now - lastFrame;
        dtAvg = dtAvg * 0.9 + dt * 0.1;
        elapsed += dt / 1000;
      }
      lastFrame = now;
      if (++frameCount % 30 === 0) adapt();
      if (revealed < 1) {
        revealed = Math.min(1, revealed + 0.05);
        if (revealed >= 1) host.dataset.storyReveal = "1";
      }
      mouseX += (mouseTX - mouseX) * 0.05;
      mouseY += (mouseTY - mouseY) * 0.05;
      progress += (progressTarget - progress) * 0.12;
      host.dataset.storyProgress = progress.toFixed(2);
      paint();
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
    }

    /* Scroll fraction over the whole homepage = the journey's timeline. */
    function updateProgress() {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      progressTarget = total > 0 ? Math.max(0, Math.min(1, window.scrollY / total)) : 0;
      if (reducedMotion && reducedMotion.matches) progress = progressTarget;
    }
    let scrollQueued = false;
    function onScroll() {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => { scrollQueued = false; updateProgress(); });
    }
    function onPointerMove(event: PointerEvent) {
      if (reducedMotion && reducedMotion.matches) return;
      mouseTX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseTY = 1 - (event.clientY / window.innerHeight) * 2;
    }
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") { visible = false; pause(); }
      else { visible = true; resume(); }
    }
    function onReducedMotionChange() {
      if (!started || !gl) return;
      if (reducedMotion && reducedMotion.matches) {
        mouseX = mouseY = 0;
        progress = progressTarget;
        setState("reduced");
      } else {
        setState("running");
      }
      resume();
    }
    function onContextLost(event: Event) {
      event.preventDefault();
      pause();
      setState("fallback");
    }

    function init() {
      cancelPendingInit = null;
      if (started || disposed) return;
      started = true;
      const layer = canvasLayerRef.current;
      if (!setup() || !layer) {
        setState("fallback");
        return;
      }
      (canvas as HTMLCanvasElement).addEventListener("webglcontextlost", onContextLost);
      layer.append(canvas as HTMLCanvasElement);
      resize();
      updateProgress();
      progress = progressTarget;
      setState(reducedMotion && reducedMotion.matches ? "reduced" : "running");
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

    const finePointer =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(pointer: fine)").matches
        : false;

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    if (finePointer) window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion?.addEventListener("change", onReducedMotionChange);
    updateProgress();
    scheduleInit();

    return () => {
      disposed = true;
      pause();
      cancelPendingInit?.();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (finePointer) window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion?.removeEventListener("change", onReducedMotionChange);
      if (canvas) {
        canvas.removeEventListener("webglcontextlost", onContextLost);
        canvas.remove();
      }
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      gl = null;
      canvas = null;
      program = null;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={cn(styles.stage, className)}
      data-story-state="static"
      data-story-tech="webgl2-sdf-scroll-journey"
      aria-hidden="true"
    >
      <span className={styles.poster} />
      <div ref={canvasLayerRef} className={styles.canvasLayer} />
      <span className={styles.vignette} />
    </div>
  );
}
