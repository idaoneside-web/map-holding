/**
 * ============================================================================
 * MAP HOLDING — CINEMATIC SCROLL STORY (shader)
 * ============================================================================
 *
 * ONE continuous WebGL2 fragment shader that raymarches a single world whose
 * form is driven entirely by scroll progress (`uProgress`), so the homepage
 * reads as one cinematic journey rather than a set of animated cards.
 *
 * The world morphs through fifteen chapters, matching the approved MAP Holding
 * cinematic journey. Adjacent chapters cross-map by blending two signed-distance
 * fields, so scrolling forward transforms one environment into the next and
 * scrolling back reverses it exactly:
 *
 *   0  Opportunity              (open ground, the ribbon alone)
 *   1  Mining & Minerals        (terraced pit, mineral specks)
 *   2  Energy & Infrastructure  (city skyline, solar array)
 *   3  Real Estate & Materials  (towers, and a crane on site)
 *   4  Technology & Innovation  (data lattice, a robot at work)
 *   5  Industrial Manufacturing (pipes, machine block, workers)
 *   6  Strategic Development    (a table with a group seated around it)
 *   7  Project Identification   (ribbon + floor — motif awaited)
 *   8  Partner Coordination     (ribbon + floor — motif awaited)
 *   9  Licensing & Consultancy  (ribbon + floor — motif awaited)
 *  10  Direct Investment        (ribbon + floor — motif awaited)
 *  11  People                   (ribbon + floor — motif awaited)
 *  12  Connected World          (a globe: the world MAP connects)
 *  13  MAP Holding Convergence  (the ribbon resolves, alone again)
 *  14  Final MAP M              (the ribbon alone, at its largest)
 *
 * The five chapters between Strategic Development and Connected World are the
 * group's operating methods; their motif arrives with their video, so the
 * ribbon and the shared floor carry them rather than inventing geometry.
 *
 * The M ribbon is present in every beat as the visual thread and grows back to
 * dominate the identity beat. No 3D library is used (Phase 3 §9): one full
 * screen triangle, SDF raymarching, and a hand-written material.
 *
 * Only shapes communicate the NATURE of the business. No numbers, names or
 * claims are ever drawn — the copy lives in the DOM, where it can be real.
 */

export const STORY_VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const STORY_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
/* Overall homepage scroll progress in [0, 1]. The whole world is a function of
   this: no scene animates on its own. */
uniform float uProgress;
uniform int   uSteps;
uniform float uReveal;
uniform vec2  uMouse;

out vec4 fragColor;

const float NUM = 14.0;              /* highest chapter index (0..14) */

const vec3 GOLD   = vec3(0.953, 0.588, 0.224);
const vec3 GOLD_L = vec3(0.969, 0.875, 0.627);
const vec3 BLUE   = vec3(0.000, 0.231, 0.639);
const vec3 BLUE_L = vec3(0.435, 0.659, 0.933);
const vec3 TEAL   = vec3(0.000, 0.573, 0.729);
const vec3 TEAL_L = vec3(0.498, 0.906, 0.824);
const vec3 NAVY   = vec3(0.016, 0.027, 0.062);
const vec3 NAVY_2 = vec3(0.031, 0.043, 0.118);

/* --- Small helpers ------------------------------------------------------- */
float hash21(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5*(b-a)/max(k,1e-5), 0.0, 1.0); return mix(b, a, h) - k*h*(1.0-h); }
float sdSegment(vec2 p, vec2 a, vec2 b){ vec2 pa = p-a, ba = b-a; float h = clamp(dot(pa,ba)/max(dot(ba,ba),1e-6), 0.0, 1.0); return length(pa - ba*h); }

/* ==========================================================================
   THE M RIBBON — the brand thread, present in every beat
   ========================================================================== */
float ribbonPath(vec2 p){
  float k = 0.20;
  float d = sdSegment(p, vec2(-1.26,-0.46), vec2(-0.72,0.60));
  d = smin(d, sdSegment(p, vec2(-0.72,0.60), vec2(-0.04,-0.28)), k);
  d = smin(d, sdSegment(p, vec2(-0.04,-0.28), vec2(0.62,0.60)), k);
  d = smin(d, sdSegment(p, vec2(0.62,0.60), vec2(1.26,-0.46)), k);
  return d;
}
float ribbonSDF(vec3 p){
  float flow = 0.26*sin(p.x*2.0 + uTime*0.25) + 0.14*cos(p.y*1.6 - uTime*0.20);
  float a = max(ribbonPath(p.xy) - 0.085, abs(p.z - flow) - 0.050);
  float b = max(ribbonPath(p.xy + vec2(0.0, 0.05)) - 0.055, abs(p.z - (flow + 0.17)) - 0.040);
  return smin(a, b, 0.05);
}
float mRibbon(vec3 p){
  vec3 q = p; q.y -= 2.15;
  /* recede through the middle of the journey, resolve large at the identity. */
  float grow = mix(1.55, 0.85, smoothstep(0.02, 0.60, uProgress));
  grow = mix(grow, 1.75, smoothstep(0.72, 1.0, uProgress));
  q /= grow;
  return ribbonSDF(q) * grow;
}

/* ==========================================================================
   SCENE MOTIFS — one small distance field per business beat
   ========================================================================== */
/* --- Figure primitives: a stylised standing person, so the scenes can show
   people at work (mining, industry, the office) rather than empty geometry. --- */
float sdCapsule(vec3 p, vec3 a, vec3 b, float r){
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba)/dot(ba, ba), 0.0, 1.0);
  return length(pa - ba*h) - r;
}
float person(vec3 p){
  float d = 1e5;
  d = min(d, sdCapsule(p, vec3( 0.10,0.00,0.0), vec3( 0.10,0.62,0.0), 0.055));
  d = min(d, sdCapsule(p, vec3(-0.10,0.00,0.0), vec3(-0.10,0.62,0.0), 0.055));
  d = min(d, sdCapsule(p, vec3( 0.00,0.62,0.0), vec3( 0.00,1.22,0.0), 0.150));
  d = min(d, sdCapsule(p, vec3( 0.16,1.16,0.0), vec3( 0.24,0.74,0.0), 0.048));
  d = min(d, sdCapsule(p, vec3(-0.16,1.16,0.0), vec3(-0.24,0.74,0.0), 0.048));
  d = min(d, length(p - vec3(0.0,1.40,0.0)) - 0.115);
  return d;
}
float personAt(vec3 p, vec3 pos, float s, float ang){
  vec3 q = p - pos;
  float c = cos(ang), sn = sin(ang);
  q = vec3(q.x*c - q.z*sn, q.y, q.x*sn + q.z*c);
  return person(q/s) * s;
}

/* 1 MINING — terraced pit, a headframe tower, and miners at work. */
float mining(vec3 p){
  float h = clamp(floor((p.x + 6.0)*0.9)*0.55, 0.0, 4.2);
  float terr = p.y - h;
  vec2 id = floor(p.xz*1.1); vec2 f = fract(p.xz*1.1) - 0.5;
  float speck = max(length(f) - 0.05 - 0.06*hash21(id), p.y - h);
  vec3 c = p - vec3(1.8, 0.0, 0.0);
  float legA = sdCapsule(c, vec3( 0.5,0.0, 0.4), vec3(0.0,3.2,0.0), 0.06);
  float legB = sdCapsule(c, vec3(-0.5,0.0, 0.4), vec3(0.0,3.2,0.0), 0.06);
  float legC = sdCapsule(c, vec3( 0.5,0.0,-0.4), vec3(0.0,3.2,0.0), 0.06);
  float legD = sdCapsule(c, vec3(-0.5,0.0,-0.4), vec3(0.0,3.2,0.0), 0.06);
  float brace = sdCapsule(c, vec3(-0.5,1.55,0.4), vec3(0.5,1.55,0.4), 0.04);
  float wheel = max(length(vec2(c.y - 3.3, c.z)) - 0.34, abs(c.x) - 0.07);
  float tower = min(min(min(legA, legB), min(legC, legD)), min(brace, wheel));
  float d = min(min(terr, speck), tower);
  d = min(d, personAt(p, vec3(-0.9, 1.10, 0.7), 0.9, 0.5));
  d = min(d, personAt(p, vec3( 0.3, 1.10,-0.8), 0.9, -0.9));
  d = min(d, personAt(p, vec3( 3.0, 1.10, 1.0), 0.9, 1.4));
  return d;
}
/* 2 ENERGY — a city lit up, with a solar array in front. */
float energy(vec3 p){
  vec2 cell = vec2(1.5);
  vec2 id = floor(p.xz/cell); vec2 f = fract(p.xz/cell) - 0.5;
  float h = 1.5 + 4.0*hash21(id);
  float towers = sdBox(vec3(f.x*cell.x, p.y - h*0.5, f.y*cell.y), vec3(0.5, h*0.5, 0.5));
  float panel = sdBox(vec3(p.x, p.y - 0.35, p.z - 3.6), vec3(2.4, 0.03, 0.5));
  return min(towers, panel);
}
/* 3 REAL ESTATE — architectural towers, plus a crane on site. */
float realestate(vec3 p){
  vec2 cell = vec2(2.0);
  vec2 id = floor(p.xz/cell); vec2 f = fract(p.xz/cell) - 0.5;
  float h = 2.5 + 6.0*hash21(id);
  float tower = sdBox(vec3(f.x*cell.x, p.y - h*0.5, f.y*cell.y), vec3(0.6, h*0.5, 0.6));
  vec3 c = p - vec3(2.4, 0.0, -2.0);
  float mast = sdBox(vec3(c.x, c.y - 2.0, c.z), vec3(0.06, 2.0, 0.06));
  float jib  = sdBox(vec3(c.x - 0.9, c.y - 3.9, c.z), vec3(1.5, 0.05, 0.05));
  float tie  = sdCapsule(c, vec3(0.0,3.9,0.0), vec3(-1.6,3.9,0.0), 0.02);
  return min(tower, min(mast, min(jib, tie)));
}
/* 4 TECHNOLOGY — a robot on a data lattice. */
float robot(vec3 p){
  float body = sdBox(vec3(p.x, p.y - 1.05, p.z), vec3(0.34, 0.42, 0.24));
  float head = sdBox(vec3(p.x, p.y - 1.62, p.z), vec3(0.20, 0.16, 0.18));
  float eye  = sdBox(vec3(p.x, p.y - 1.62, p.z - 0.19), vec3(0.12, 0.03, 0.02));
  float legL = sdCapsule(p, vec3( 0.15,0.00,0.0), vec3( 0.15,0.60,0.0), 0.06);
  float legR = sdCapsule(p, vec3(-0.15,0.00,0.0), vec3(-0.15,0.60,0.0), 0.06);
  float armL = sdCapsule(p, vec3( 0.34,1.30,0.0), vec3( 0.62,0.85,0.0), 0.05);
  float armR = sdCapsule(p, vec3(-0.34,1.30,0.0), vec3(-0.62,0.85,0.0), 0.05);
  return min(min(min(body, head), min(eye, legL)), min(min(legR, armL), armR));
}
float technology(vec3 p){
  vec3 q = p - round(p);
  float node = length(q) - 0.09;
  float rod = min(min(length(q.yz), length(q.xz)), length(q.xy)) - 0.025;
  float lat = min(node, rod);
  float rob = robot(p);
  float core = length(p - vec3(0.0, 1.4, 0.0)) - 0.22;
  return min(min(lat, rob), core);
}
/* 5 INDUSTRIAL — pipes, a machine block, a stack, and workers. */
float industrial(vec3 p){
  float pipe1 = length(vec2(p.y - 0.95, mod(p.z + 1.0, 2.0) - 1.0)) - 0.16;
  float pipe2 = length(vec2(p.y - 1.65, mod(p.x + 1.0, 2.0) - 1.0)) - 0.12;
  float block = sdBox(vec3(p.x - 1.7, p.y - 0.5, p.z - 1.3), vec3(0.6, 0.5, 0.6));
  float stack = max(length(p.xz - vec2(-1.9, 1.0)) - 0.26, abs(p.y - 1.7) - 1.7);
  float d = min(min(pipe1, pipe2), min(block, stack));
  d = min(d, personAt(p, vec3( 0.0, 0.0, 1.7), 0.95,  0.0));
  d = min(d, personAt(p, vec3( 0.7, 0.0, 1.1), 0.95, -0.6));
  d = min(d, personAt(p, vec3(-0.5, 0.0, 2.1), 0.95,  0.5));
  return d;
}
/* 6 STRATEGIC — an office: a table with a group seated around it. */
float strategic(vec3 p){
  float table = sdBox(vec3(p.x, p.y - 0.74, p.z), vec3(1.4, 0.05, 0.6));
  float leg1 = sdBox(vec3(p.x - 1.2, p.y - 0.37, p.z), vec3(0.05, 0.37, 0.5));
  float leg2 = sdBox(vec3(p.x + 1.2, p.y - 0.37, p.z), vec3(0.05, 0.37, 0.5));
  float lightbar = sdBox(vec3(p.x, p.y - 2.55, p.z), vec3(1.6, 0.04, 0.3));
  float d = min(min(table, leg1), min(leg2, lightbar));
  d = min(d, personAt(p, vec3(-1.0, 0.0, 0.95), 0.66, 3.14159));
  d = min(d, personAt(p, vec3( 0.0, 0.0, 0.95), 0.66, 3.14159));
  d = min(d, personAt(p, vec3( 1.0, 0.0, 0.95), 0.66, 3.14159));
  d = min(d, personAt(p, vec3(-0.6, 0.0,-0.95), 0.66, 0.0));
  d = min(d, personAt(p, vec3( 0.6, 0.0,-0.95), 0.66, 0.0));
  return d;
}
/* 12 CONNECTED WORLD — a globe: MAP connects opportunities across the world. */
float connectedWorld(vec3 p){
  return length(p - vec3(0.0, 1.7, 0.0)) - 1.35;
}

/*
 * Chapters 8-12 (indices 7-11) have no motif yet: their motif ships with their
 * video, so they are deliberately absent here rather than filled with unrelated
 * geometry. Chapter 15 (index 13 is Convergence, index 14 is the identity) has
 * no motif either — the ribbon alone is the identity.
 */
float sceneAt(int i, vec3 p){
  if (i <= 0) return 1e5;
  if (i == 1) return mining(p);
  if (i == 2) return energy(p);
  if (i == 3) return realestate(p);
  if (i == 4) return technology(p);
  if (i == 5) return industrial(p);
  if (i == 6) return strategic(p);
  if (i == 12) return connectedWorld(p);
  return 1e5;
}

vec3 sceneTint(int i){
  if (i <= 0) return mix(GOLD, BLUE, 0.5);
  if (i == 1) return GOLD;
  if (i == 2) return TEAL;
  if (i == 3) return BLUE;
  if (i == 4) return mix(BLUE, TEAL, 0.5);
  if (i == 5) return mix(GOLD, vec3(0.62, 0.66, 0.72), 0.45);
  if (i == 6) return mix(BLUE, GOLD, 0.35);
  if (i == 7) return mix(BLUE, GOLD, 0.50);
  if (i == 8) return mix(GOLD, BLUE, 0.50);
  if (i == 9) return mix(BLUE, TEAL, 0.35);
  if (i == 10) return mix(GOLD, BLUE, 0.60);
  if (i == 11) return mix(GOLD, TEAL, 0.50);
  if (i == 12) return mix(TEAL, BLUE, 0.40);
  if (i == 13) return mix(GOLD, BLUE, 0.50);
  return mix(GOLD, TEAL, 0.5);
}

/* --- World: two adjacent motifs cross-mapped by scroll, over one floor ------ */
vec2 map(vec3 p){
  float sf = clamp(uProgress, 0.0, 1.0) * NUM;
  int iA = int(floor(sf + 1e-4));
  float w = smoothstep(0.0, 1.0, fract(sf));
  float env = mix(sceneAt(iA, p), sceneAt(iA + 1, p), w);
  env = min(env, p.y);                 /* shared floor so nothing floats in void */
  float rb = mRibbon(p);
  if (rb < env) return vec2(rb, 0.0);
  return vec2(env, 1.0);
}

vec3 calcNormal(vec3 p){
  vec2 e = vec2(1.0, -1.0) * 0.0018;
  return normalize(e.xyy*map(p+e.xyy).x + e.yyx*map(p+e.yyx).x + e.yxy*map(p+e.yxy).x + e.xxx*map(p+e.xxx).x);
}

float march(vec3 ro, vec3 rd, out float hitId){
  float t = 0.08;
  hitId = 1.0;
  for (int i = 0; i < 128; i++){
    if (i >= uSteps) break;
    vec3 p = ro + rd*t;
    vec2 d = map(p);
    if (d.x < 0.0018*t){ hitId = d.y; return t; }
    t += d.x*0.72;
    if (t > 26.0) break;
  }
  return -1.0;
}

vec3 background(vec3 rd, vec2 uv){
  vec3 col = mix(NAVY_2, NAVY, smoothstep(0.9, -1.0, rd.y));
  float glow = exp(-dot(uv*vec2(1.0,1.5), uv*vec2(1.0,1.5)) * 2.2);
  col += (GOLD*0.03 + BLUE*0.11 + TEAL*0.07) * glow;
  return col;
}

vec3 shade(vec3 p, vec3 n, vec3 rd, float id, vec3 ro){
  float sf = clamp(uProgress, 0.0, 1.0) * NUM;
  int iA = int(floor(sf + 1e-4));
  float w = smoothstep(0.0, 1.0, fract(sf));
  vec3 base = mix(sceneTint(iA), sceneTint(iA + 1), w);

  vec3 keyDir = normalize(vec3(-0.45, 0.85, 0.55));
  vec3 fillDir = normalize(vec3(0.75, 0.35, 0.25));
  float diff = max(dot(n, keyDir), 0.0);
  float fill = max(dot(n, fillDir), 0.0);
  float rim  = pow(1.0 - max(dot(n, -rd), 0.0), 2.4);

  vec3 col;
  if (id < 0.5){
    /* The ribbon: brushed metal carrying the mark's amber -> blue -> teal. */
    float g = clamp(p.x*0.36 + 0.5 + 0.12*sin(p.z*1.7 + uTime*0.1), 0.0, 1.0);
    float gGold = smoothstep(0.0, 0.52, g);
    float gTeal = smoothstep(0.55, 1.0, g);
    vec3 tint = mix(mix(GOLD, BLUE, gGold), TEAL, gTeal);
    vec3 shine = mix(mix(GOLD_L, BLUE_L, gGold), TEAL_L, gTeal);
    float spec = pow(max(dot(n, normalize(keyDir - rd)), 0.0), 64.0);
    col  = tint * (0.22 + 0.6*diff + 0.18*fill);
    col += tint * 0.06;
    col += shine * spec * 1.8;
    col += shine * rim * 0.30;
  } else {
    /* Environment: tinted surface with a subtle cell grid for scale. */
    float grid = smoothstep(0.94, 1.0, max(sin(p.x*3.14159), sin(p.z*3.14159))*0.5+0.5);
    col  = base * (0.18 + 0.72*diff + 0.22*fill);
    col += base * 0.4 * grid * 0.5;
    col += base * rim * 0.45;
    /* Energy (2) city and Real Estate (3) towers: lit windows, so the
       buildings read as inhabited at night. */
    if (iA == 2 || iA == 3) {
      float winY = step(0.55, fract(p.y*3.0));
      float winX = step(0.5, fract((p.x + p.z)*2.5));
      col += mix(TEAL_L, GOLD_L, 0.25) * winY * winX * (iA == 2 ? 0.9 : 0.5);
    }
    /* Technology (4): glinting lattice nodes. */
    if (iA == 4) {
      float g = smoothstep(0.24, 0.0, length(p - round(p)) - 0.09);
      col += TEAL_L * g * 0.6;
    }
    /* Connected World (12): paint a stylised landmask on the globe so it reads
       as the world MAP connects, not a plain sphere. */
    if (iA == 12) {
      vec3 dir = normalize(p - vec3(0.0, 1.7, 0.0));
      float lat = asin(clamp(dir.y, -1.0, 1.0));
      float lon = atan(dir.z, dir.x);
      float f = sin(lat*5.0 + 0.6*sin(lon*3.0)) * sin(lon*4.0 + 1.3);
      float land = smoothstep(0.0, 0.35, f);
      col = mix(col, mix(TEAL_L, GOLD_L, 0.25), land*0.7);
    }
  }
  float fog = smoothstep(7.0, 22.0, length(p - ro));
  col = mix(col, NAVY, fog*0.85);
  return col;
}

void main(){
  vec2 res = uResolution;
  float aspect = res.x / max(res.y, 1.0);
  vec2 uv = (gl_FragCoord.xy - 0.5*res) / res.y;

  float pr = clamp(uProgress, 0.0, 1.0);
  float yaw = -0.35 + pr*0.85 + uMouse.x*0.12;
  float rad = 6.6 - pr*2.0;
  float camY = max(3.7 - pr*2.1, 1.15);
  vec3 ro = vec3(sin(yaw)*rad, camY, cos(yaw)*rad);
  vec3 ta = vec3(0.0, mix(1.9, 1.2, pr) + uMouse.y*0.35, 0.0);
  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0.0,1.0,0.0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(uv.x*uu + uv.y*vv + 1.6*ww);

  vec3 col = background(rd, uv);
  float id;
  float t = march(ro, rd, id);
  if (t > 0.0){
    vec3 p = ro + rd*t;
    col = shade(p, calcNormal(p), rd, id, ro);
  }

  float vig = 1.0 - 0.40*dot(uv, uv);
  col *= vig;
  col = col / (col + vec3(0.92));
  col = pow(max(col, vec3(0.0)), vec3(0.92));
  fragColor = vec4(col, uReveal);
}
`;

export const STORY_MAX_STEPS = 128;
export const STORY_MIN_STEPS = 48;
export const STORY_MAX_PIXELS = 470_000;
export const STORY_NUM_SCENES = 15;
