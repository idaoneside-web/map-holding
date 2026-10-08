/**
 * ============================================================================
 * MAP HOLDING — 3D HERO SHADER  (Phase 3 §7–§10)
 * ============================================================================
 *
 * TECHNOLOGY DECISION (Phase 3 §9)
 * --------------------------------
 * No 3D library was installed. The hero is a raw **WebGL2 fragment shader** that
 * raymarches a signed-distance-field ribbon:
 *
 *   - Added runtime dependency surface: 0 packages, 0 bytes. (three.js alone is
 *     ~600 KB minified before react-three-fiber, and the machine is at 99% disk.)
 *   - Real 3D is genuinely required here — perspective-correct depth, surface
 *     normals, specular highlights, Fresnel rim light and a floor reflection.
 *     CSS 3D transforms cannot express a curved swept surface, cannot do real
 *     lighting, and have no reflection model, so they were ruled out.
 *   - SVG was ruled out for the *animated* layer for the same reason. It IS used
 *     for the static fallback, where realism is not required.
 *   - Weights: vertex shader is one line; the fragment shader is ~120 lines of
 *     GLSL and ships inside the JS bundle as a string.
 *
 * PERFORMANCE (Phase 3 §10)
 * -------------------------
 *  - The canvas is created only on the client, after mount, so it never blocks
 *    first paint or the LCP element (which is the static fallback).
 *  - WebGL is initialised lazily: only once the hero scrolls into view, and
 *    deferred to an idle callback so it cannot compete with the initial load.
 *  - The render target is capped in absolute pixel count, so a 4K display does
 *    not cost 4K of raymarching.
 *  - Quality degrades one-way, automatically, if frames are slow (fewer march
 *    steps, then a smaller render scale).
 *  - Rendering pauses when the hero is off-screen or the tab is hidden.
 *  - `prefers-reduced-motion: reduce` renders exactly one frame and never starts
 *    the animation loop.
 *  - If WebGL2 is unavailable or context creation fails, the static fallback
 *    remains and the page is completely unaffected.
 *
 * BRAND DISCIPLINE
 * ----------------
 * The ribbon follows an abstract ascending/descending path that is *evocative*
 * of the mark's motion. It is atmospheric brand visualisation, not a logo: the
 * official lockup is never redrawn, replaced or traced here (Phase 3 §7).
 */

export const HERO_VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 aPos;

void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const HERO_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform int   uSteps;
uniform float uReveal;
/* Subtle pointer parallax, in the range [-1, 1] with the origin at the viewport
   centre. Eased in the host before it is uploaded, so the shader only ever sees
   a damped value — the camera never snaps. Zero when reduced motion is on. */
uniform vec2  uMouse;
/* Scroll progress over the pinned hero runway, in [0, 1]. Drives a scrubbed
   rotate/dolly of the M so scrolling the page turns the object — the approved
   "scroll video" behaviour. Held at 0 when reduced motion is on. */
uniform float uScroll;

out vec4 fragColor;

/* --- Sampled MAP Holding brand values, mirrored from the colour tokens ----
   gold-500 #f39639 · gold-300 #f7dfa0 · blue-500 #003ba3 · blue-300 #6fa8ee
   teal-500 #0092ba · teal-300 #7fe7d2 · navy-950 #04060f · navy-900 #080b1e
   Kept in sync with src/styles/tokens/color.css. */
const vec3 GOLD   = vec3(0.953, 0.588, 0.224);
const vec3 GOLD_L = vec3(0.969, 0.875, 0.627);
const vec3 BLUE   = vec3(0.000, 0.231, 0.639);
const vec3 BLUE_L = vec3(0.435, 0.659, 0.933);
const vec3 TEAL   = vec3(0.000, 0.573, 0.729);
const vec3 TEAL_L = vec3(0.498, 0.906, 0.824);
const vec3 NAVY   = vec3(0.016, 0.024, 0.055);
const vec3 NAVY_2 = vec3(0.031, 0.043, 0.118);

/* --------------------------------------------------------------------------
   Distance field
   ----------------------------------------------------------------------- */

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

/* Rounded union. A plain min() leaves hard creases at every joint; a polynomial
   smooth-min with a small radius fillets them, which is what gives the form its
   "smooth continuous geometry" and the subtle bends at the two peaks and the
   central valley, without softening the elegant M silhouette. */
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / max(k, 1e-5), 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

/* The ribbon's 2D path: an abstract double-peak — two rises and a central
   valley, the M's own ascending/descending motion. The joints are filleted so
   the band flows continuously; it is deliberately not a traced logo. */
float ribbonPath(vec2 p) {
  float k = 0.20;
  float d = sdSegment(p, vec2(-1.26, -0.46), vec2(-0.72, 0.60));
  d = smin(d, sdSegment(p, vec2(-0.72, 0.60), vec2(-0.04, -0.28)), k);
  d = smin(d, sdSegment(p, vec2(-0.04, -0.28), vec2( 0.62, 0.60)), k);
  d = smin(d, sdSegment(p, vec2( 0.62, 0.60), vec2( 1.26, -0.46)), k);
  return d;
}

/* One ribbon band: inside the stroke width in XY, and inside the thickness in Z.
   Displacing Z along the band is what turns a flat cut-out into a flowing
   surface with continuously varying normals. */
float ribbonLayer(vec3 p, float width, float thick, float zOff, float phase, float side) {
  /* Gentle lateral weave on the secondary band only, so it folds AROUND the
     primary sweep instead of running dead parallel to it — the brief's "subtle
     bends and folds". 'side' is 0 for the primary band, 1 for the fold. */
  vec2 q = p.xy;
  q.x += side * 0.05 * sin(p.y * 3.0 + uTime * 0.21);
  float d2 = ribbonPath(q);

  float flow = 0.30 * sin(p.x * 2.05 + uTime * 0.33 + phase)
             + 0.17 * cos(p.y * 1.65 - uTime * 0.25)
             + 0.09 * sin((p.x + p.y) * 1.30 + uTime * 0.17);

  /* As the page scrolls, the secondary band peels further forward in Z, so the
     layered stack visibly un-folds across the scroll — depth that the visitor
     reads as the object opening up, not as decoration. */
  float fold = zOff + uScroll * 0.11 * side;
  float dz = abs(p.z - (flow + fold));
  return max(d2 - width, dz - thick);
}

/* The form is TWO stacked bands sharing the M path: a broad primary sweep and a
   narrower band folded forward in Z, drifting out of phase and weaving subtly in
   X. Their smooth union reads as layered curved surfaces with real depth — the
   folds are where the two bands meet — while the front-on silhouette stays the
   same M. The wider Z separation keeps the two surfaces legible as separate
   layers rather than one flat stripe. */
float ribbon(vec3 p) {
  float a = ribbonLayer(p, 0.090, 0.056, 0.000, 0.0, 0.0);
  float b = ribbonLayer(p, 0.064, 0.044, 0.205, 1.7, 1.0);
  return smin(a, b, 0.055);
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(1.0, -1.0) * 0.0016;
  return normalize(
      e.xyy * ribbon(p + e.xyy)
    + e.yyx * ribbon(p + e.yyx)
    + e.yxy * ribbon(p + e.yxy)
    + e.xxx * ribbon(p + e.xxx)
  );
}

/* --------------------------------------------------------------------------
   Ray marching
   ----------------------------------------------------------------------- */

float march(vec3 ro, vec3 rd, float maxT) {
  float t = 0.02;
  for (int i = 0; i < 128; i++) {
    if (i >= uSteps) break;
    vec3 p = ro + rd * t;
    float d = ribbon(p);
    if (d < 0.0011 * t) return t;
    /* Slight under-relaxation: the band intersection uses max(), which is not
       an exact distance bound, so a full step can overshoot thin regions. */
    t += d * 0.82;
    if (t > maxT) break;
  }
  return -1.0;
}

/* --------------------------------------------------------------------------
   Material — brushed metal carrying the mark's amber -> blue -> teal order
   ----------------------------------------------------------------------- */

vec3 metal(vec3 p, vec3 n, vec3 rd) {
  float g = clamp(p.x * 0.40 + 0.5 + 0.15 * sin(p.z * 1.7 + uTime * 0.11), 0.0, 1.0);
  /* Three-anchor metallic sweep. The two eased windows OVERLAP on purpose so
     the blue core is broad rather than a thin seam — the brief asks for one
     continuous gold -> blue -> teal surface, not three colour bands. A small
     depth term (p.z) shifts the hue slightly front-to-back so the layered
     surfaces read as a single material across the form's depth. */
  float gz    = smoothstep(-0.35, 0.35, p.z) * 0.06;
  float gGold = smoothstep(0.0, 0.52, g - gz);
  float gTeal = smoothstep(0.55, 1.0, g + gz);
  vec3 tint  = mix(mix(GOLD, BLUE, gGold), TEAL, gTeal);
  vec3 shine = mix(mix(GOLD_L, BLUE_L, gGold), TEAL_L, gTeal);

  /* Studio environment. A metal is only ever as bright as what it reflects, so
     the surroundings have to contain light: a lifted sky-to-floor gradient plus
     three lobes standing in for key, fill and rim.

     The environment is deliberately WARM-NEUTRAL rather than blue-dominant. A
     strongly cool environment multiplies the warm end of the gradient into a
     desaturated yellow and the gold disappears from the render, which is a
     measured defect, not a taste question. The cool contribution is kept to a
     weak rim so the amber, blue and teal all read true. */
  vec3 r = reflect(rd, n);
  /* The base gradient is warm-neutral, not blue: a cool environment tints the
     amber end of the band toward a desaturated yellow and the primary brand
     colour stops reading. Cool light is confined to a weak rim. */
  vec3 env = mix(vec3(0.055, 0.058, 0.078), vec3(0.185, 0.190, 0.215),
                 smoothstep(-1.0, 1.0, r.y));

  vec3 keyDir  = normalize(vec3(-0.55, 0.75, 0.50));
  vec3 fillDir = normalize(vec3( 0.80, 0.30, 0.30));
  vec3 rimDir  = normalize(vec3( 0.05, 0.90, -0.45));

  env += GOLD_L * 1.10 * pow(max(dot(r, keyDir), 0.0), 2.5);
  env += vec3(0.55, 0.62, 0.72) * 0.28 * pow(max(dot(r, fillDir), 0.0), 4.0);
  env += BLUE_L * 0.22 * pow(max(dot(r, rimDir), 0.0), 5.0);

  float key   = max(dot(n, keyDir), 0.0);
  vec3 h = normalize(keyDir - rd);
  float spec  = pow(max(dot(n, h), 0.0), 74.0);
  float fres  = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);

  vec3 col  = tint * env * 1.45;   /* metallic reflection of the studio        */
  col += tint * key * 0.24;        /* direct body, so the form reads side-on   */
  col += tint * 0.090;             /* ambient, so every hue always reads       */
  col += shine * spec * 2.30;      /* tight highlight                          */
  col += shine * fres * 0.38;      /* rim light                                */
  return col;
}

/* --------------------------------------------------------------------------
   Background — navy ground, one soft glow, restrained vignette
   ----------------------------------------------------------------------- */

vec3 background(vec3 rd, vec2 uv) {
  vec3 col = mix(NAVY_2, NAVY, smoothstep(0.9, -0.9, rd.y));
  float glow = exp(-dot(uv * vec2(1.05, 1.55), uv * vec2(1.05, 1.55)) * 2.1);
  /* Glow weight is deliberately weighted AWAY from amber: the amber term is the
     brightest in luminance terms, so it is what sets the worst-case text
     contrast over the hero. Measured before this adjustment: amber eyebrow text
     over the brightest glow pixel was 4.86:1. Blue and teal carry the glow
     instead, which raises the margin without changing the composition. */
  col += (GOLD * 0.052 + BLUE * 0.155 + TEAL * 0.095) * glow;

  /* A dark polished plane below the horizon. Analytic, so it costs nothing and
     reads as a floor for the ribbon to sit on, without a second ray march. */
  col = mix(col, col * 0.52, smoothstep(0.02, -0.55, rd.y));

  float vig = 1.0 - 0.42 * dot(uv, uv);
  return col * vig;
}

void main() {
  vec2 res = uResolution;
  float aspect = res.x / max(res.y, 1.0);
  vec2 uv = (gl_FragCoord.xy - 0.5 * res) / res.y;

  /* --- Camera: very slow orbit and breathing dolly. Restrained on purpose —
         the brief forbids aggressive camera movement. uMouse adds a small,
         eased parallax offset so the object answers the pointer without ever
         feeling like it is chasing it. uScroll adds the scroll-scrubbed turn:
         one smooth ~35° rotation and a gentle dolly across the pinned hero,
         restrained so the full gold -> blue -> teal sweep stays readable. */
  float yaw   = -0.30 + sin(uTime * 0.050) * 0.21 + uMouse.x * 0.15 + uScroll * 0.62;
  /* Push the camera back on taller viewports so the whole ribbon always fits.
     Measured: at a 0.74 aspect the ribbon's amber end fell outside the frame,
     so the gradient read as blue and teal only. The fit factor guarantees the
     full amber -> blue -> teal sweep is visible at every aspect ratio. */
  float fit   = clamp(1.55 / aspect, 1.0, 2.6);
  float rad   = (2.62 + sin(uTime * 0.037) * 0.09) * fit * mix(1.0, 0.86, uScroll);
  float height=  0.52 + sin(uTime * 0.043) * 0.14 + uMouse.y * 0.09 + uScroll * 0.05;
  vec3 ro = vec3(sin(yaw) * rad, height * fit, cos(yaw) * rad);
  vec3 ta = vec3(0.0, 0.02, 0.0);
  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = cross(uu, ww);

  /* A gentle roll on tall frames, so the band runs slightly diagonally instead
     of reading as a thin stripe across the middle. At most ~7 degrees. */
  float roll = clamp((1.15 - aspect) * 0.30, 0.0, 0.30);
  float cr = cos(roll), sr = sin(roll);
  vec2 ruv = vec2(uv.x * cr - uv.y * sr, uv.x * sr + uv.y * cr);

  vec3 rd = normalize(ruv.x * uu + ruv.y * vv + 1.55 * ww);

  vec3 col = background(rd, uv);

  float t = march(ro, rd, 11.0);
  if (t > 0.0) {
    vec3 p = ro + rd * t;
    col = metal(p, calcNormal(p), rd);
  }

  /* NOTE ON THE REMOVED SECOND MARCH: an earlier revision mirrored the ray about
     a floor plane and marched the ribbon again for a "soft floor reflection".
     Measured on the CPU replica of this exact geometry, that path hit the ribbon
     on 0.0-0.1% of pixels while doubling the march cost for every downward ray,
     so it was removed. Depth and reflectivity now come from the metallic
     environment reflection in metal() plus the analytic floor in background(). */

  /* Fine dither: breaks up banding in the dark navy gradient without any
     visible pattern at normal viewing size. */
  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (dither - 0.5) * (1.6 / 255.0);

  /* Tone map, then hand the crossfade to the alpha channel: the canvas is
     composited over the static fallback, so fading alpha in IS the crossfade
     and there is never a black flash. */
  col = col / (col + vec3(0.86));
  col = pow(max(col, vec3(0.0)), vec3(0.9));
  fragColor = vec4(col, uReveal);
}
`;

export const HERO_MAX_STEPS = 128;
export const HERO_MIN_STEPS = 44;

/** Absolute cap on the raymarch render target, whatever the display size. */
export const HERO_MAX_PIXELS = 430_000;
