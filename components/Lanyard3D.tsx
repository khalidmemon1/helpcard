"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Vector3 } from "three";
import { drawBadge } from "@/lib/badgeArt";
import type { Card } from "@/lib/card";

/**
 * The hero: a real 3D badge on a lanyard, after the owner's Framer page. three.js only (lazy-loaded), with a tiny
 * verlet simulation instead of a physics engine: the strap is a rope pinned above the screen, the clip hangs from
 * it, the card hangs from the clip. Drag the card to swing it, tap it to flip it (the back has the QR).
 * Renders only while on screen. No WebGL → `fallback` (the CSS lanyard).
 */
type Faces = { front: HTMLCanvasElement; back: HTMLCanvasElement };
type Api = { setFaces: (f: Faces) => void };

export function Lanyard3D({ card, url, photo, fallback }: { card: Card; url: string; photo: HTMLImageElement | null; fallback: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const latest = useRef<Faces | null>(null);
  const [failed, setFailed] = useState(false);

  // new faces whenever the card changes (a short wait so typing doesn't redraw on every key)
  useEffect(() => {
    const id = setTimeout(async () => {
      const [front, back] = await Promise.all([drawBadge(card, url, photo, "front"), drawBadge(card, url, photo, "back")]);
      latest.current = { front, back };
      api.current?.setFaces(latest.current);
    }, 120);
    return () => clearTimeout(id);
  }, [card, url, photo]);

  useEffect(() => {
    // the scene loads asynchronously: if the component is gone (or remounted) before it's ready, tear it down
    let stop: (() => void) | null = null, gone = false;
    start(host.current!, (a) => {
      if (gone) return;
      api.current = a;
      if (latest.current) a.setFaces(latest.current);
    })
      .then((s) => (gone ? s() : (stop = s)))
      .catch(() => !gone && setFailed(true));
    return () => {
      gone = true;
      api.current = null;
      stop?.();
    };
  }, []);

  if (failed) return <>{fallback}</>;
  return <div className="lanyard3d" ref={host} />;
}

async function start(el: HTMLDivElement, ready: (a: Api) => void): Promise<() => void> {
  const THREE = await import("three");
  const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
  const stage = el.closest(".hero") as HTMLElement; // pointer events come from the whole hero, so its buttons still work

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // throws without WebGL → fallback
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xffffff, 0.7);
  sun.position.set(2, 4, 6);
  scene.add(sun, new THREE.AmbientLight(0xffffff, 0.25));
  const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 100);
  const FOV = Math.tan(THREE.MathUtils.degToRad(12.5));

  // ---- the card: a thin rounded slab with a hole, a picture on each side ----
  const W = 1.25, H = (W * 85.6) / 54, T = 0.022;
  const HOLE_Y = H / 2 - H * 0.057; // hole centre, from the card's centre
  const shape = roundRect(new THREE.Shape(), -W / 2, -H / 2, W, H, W * 0.065);
  const holeW = (210 / 1080) * W, holeH = (46 / 1712) * H;
  shape.holes.push(roundRect(new THREE.Path(), -holeW / 2, HOLE_Y - holeH / 2, holeW, holeH, holeH / 2));
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 10 }).translate(0, 0, -T / 2),
    new THREE.MeshStandardMaterial({ color: 0xe9eaec, roughness: 0.6 }),
  );
  const faceMat = () => new THREE.MeshPhysicalMaterial({ transparent: true, alphaTest: 0.5, roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.4, envMapIntensity: 0.45 });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(W, H), faceMat());
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), faceMat());
  front.position.z = T / 2 + 0.0008;
  back.position.z = -T / 2 - 0.0008;
  back.rotation.y = Math.PI;
  const cardGroup = new THREE.Group(); // the card, its centre below the hole
  cardGroup.add(body, front, back);
  cardGroup.position.y = -HOLE_Y;
  const twist = new THREE.Group(); // spins around the card's own vertical axis
  twist.add(cardGroup);
  const pivot = new THREE.Group(); // at the hole; tilts with the swing
  pivot.add(twist);
  scene.add(pivot);

  // ---- the clip: D-ring, swivel and a hook through the hole, all polished metal ----
  const metal = new THREE.MeshStandardMaterial({ color: 0xd9dce0, metalness: 1, roughness: 0.22 });
  const clip = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.019, 14, 48), metal);
  ring.scale.set(1, 1.25, 1);
  ring.position.y = 0.25;
  const swivel = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.1, 18), metal);
  swivel.position.y = 0.1;
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.013, 12, 32, Math.PI * 1.65), metal);
  hook.rotation.set(0, Math.PI / 2, Math.PI * 0.7);
  hook.position.y = 0.015;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.035), new THREE.MeshStandardMaterial({ color: 0xbfc3c8, metalness: 0.9, roughness: 0.3 }));
  cap.position.y = 0.4;
  clip.add(ring, swivel, hook, cap);
  scene.add(clip);
  const CLIP = 0.4; // hole → strap end

  // ---- the strap: a woven ribbon drawn along the rope ----
  const weave = document.createElement("canvas");
  weave.width = 64;
  weave.height = 64;
  const wg = weave.getContext("2d")!;
  wg.fillStyle = "#3a3d43";
  wg.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 4) {
    wg.fillStyle = y % 8 ? "#2f3237" : "#464a51";
    wg.fillRect(0, y, 64, 2);
  }
  const edge = wg.createLinearGradient(0, 0, 64, 0);
  edge.addColorStop(0, "rgba(0,0,0,.45)");
  edge.addColorStop(0.15, "rgba(0,0,0,0)");
  edge.addColorStop(0.85, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,.45)");
  wg.fillStyle = edge;
  wg.fillRect(0, 0, 64, 64);
  const weaveTex = new THREE.CanvasTexture(weave);
  weaveTex.wrapT = THREE.RepeatWrapping;
  weaveTex.colorSpace = THREE.SRGBColorSpace;
  const STRAP_W = 0.28, SAMPLES = 48;
  const strapGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array(SAMPLES * 2 * 3), sUv = new Float32Array(SAMPLES * 2 * 2), sIdx: number[] = [];
  for (let i = 0; i < SAMPLES - 1; i++) {
    const a = i * 2;
    sIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  strapGeo.setIndex(sIdx);
  strapGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
  strapGeo.setAttribute("uv", new THREE.BufferAttribute(sUv, 2));
  const strap = new THREE.Mesh(strapGeo, new THREE.MeshStandardMaterial({ map: weaveTex, roughness: 0.85, side: THREE.DoubleSide }));
  strap.frustumCulled = false;
  scene.add(strap);

  // ---- the simulation: rope points P[0..N] (P[0] pinned), clip point A, card bottom B ----
  const N = 10;
  type P = { p: Vector3; o: Vector3; w: number }; // position, previous position, inverse mass
  const mk = (w: number): P => ({ p: new THREE.Vector3(), o: new THREE.Vector3(), w });
  const rope = Array.from({ length: N + 1 }, (_, i) => mk(i === 0 ? 0 : 1));
  const A = mk(0.6), B = mk(0.25);
  const LINKS: [P, P, number][] = [];
  let anchorY = 2.6, seg = 0.15;
  const CARD_L = H * 0.943; // hole → bottom edge

  function layout() {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the card a sensible size on narrow screens: pull the camera back so ~3.4 units fit across
    const dist = Math.max(10, (h > w ? 2.9 : 3.4) / (2 * FOV * camera.aspect));
    camera.position.set(0, 0, dist);
    camera.updateProjectionMatrix();
    const half = dist * FOV;
    anchorY = half + 0.35;
    const cardTop = half - 2 * half * (h > w ? 0.17 : 0.31); // where the Framer card's top edge sits
    const strapLen = Math.max(0.8, anchorY - (cardTop + H * 0.057) - CLIP);
    seg = strapLen / N;
    LINKS.length = 0;
    for (let i = 0; i < N; i++) LINKS.push([rope[i], rope[i + 1], seg]);
    LINKS.push([rope[N], A, CLIP], [A, B, CARD_L]);
  }
  function place(swing: number) {
    rope.forEach((r, i) => {
      r.p.set(Math.sin(swing) * i * seg, anchorY - i * seg, 0);
      r.o.copy(r.p);
    });
    A.p.set(rope[N].p.x + Math.sin(swing) * CLIP, rope[N].p.y - CLIP, 0);
    A.o.copy(A.p);
    B.p.set(A.p.x + Math.sin(swing) * CARD_L, A.p.y - CARD_L, 0);
    B.o.copy(B.p);
  }
  layout();
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  place(still ? 0 : 0.35); // starts off to the side so it swings in

  let phi = 0, phiV = 0, flips = 0, drag: { off: Vector3; target: Vector3; x: number; y: number; t: number } | null = null;
  const all = [...rope, A, B];
  const tmp = new THREE.Vector3();
  function step(dt: number, time: number) {
    const g = -14 * dt * dt;
    for (const q of all) {
      if (!q.w) continue;
      tmp.copy(q.p).sub(q.o).multiplyScalar(0.985); // velocity with a little air drag
      q.o.copy(q.p);
      q.p.add(tmp);
      q.p.y += g;
      q.p.z *= 0.96; // stay roughly in the screen plane
    }
    if (!still && !drag) B.p.x += Math.sin(time * 0.7) * 0.000004; // a breath of wind (adds up: keep it tiny)
    if (drag) {
      B.o.copy(B.p);
      B.p.lerp(tmp.copy(drag.target).add(drag.off), 0.6);
    }
    for (let k = 0; k < 14; k++) {
      for (const [a, b, len] of LINKS) {
        tmp.copy(b.p).sub(a.p);
        const d = tmp.length() || 1e-6, wsum = a.w + b.w;
        if (!wsum) continue;
        tmp.multiplyScalar((d - len) / d / wsum);
        a.p.addScaledVector(tmp, a.w);
        b.p.addScaledVector(tmp, -b.w);
      }
      rope[0].p.set(0, anchorY, 0);
      if (drag) B.p.lerp(tmp.copy(drag.target).add(drag.off), 0.5);
    }
    // the card turns with its sideways speed and springs back to the side it was flipped to
    const vx = (B.p.x - B.o.x) / dt;
    phiV += ((flips * Math.PI - phi) * 30 - phiV * 5 + vx * 2.2) * dt;
    phi += phiV * dt;
  }

  const up = new THREE.Vector3();
  function draw() {
    up.copy(A.p).sub(B.p);
    pivot.position.copy(A.p);
    pivot.rotation.z = Math.atan2(-up.x, up.y);
    twist.rotation.y = phi;
    up.copy(rope[N].p).sub(A.p);
    clip.position.copy(A.p);
    clip.rotation.z = Math.atan2(-up.x, up.y);
    // ribbon through the rope points, its flat side to the camera, ending in the clip's cap
    const pts = rope.map((r) => r.p.clone());
    pts[N] = new THREE.Vector3(0, 0.4, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), clip.rotation.z).add(A.p);
    const curve = new THREE.CatmullRomCurve3(pts);
    const side = new THREE.Vector3();
    let v = 0;
    let prev = curve.getPoint(0);
    for (let i = 0; i < SAMPLES; i++) {
      const u = i / (SAMPLES - 1), c = curve.getPoint(u), t = curve.getTangent(u);
      side.set(t.y, -t.x, 0).normalize().multiplyScalar(STRAP_W / 2);
      v += c.distanceTo(prev);
      prev = c;
      sPos.set([c.x - side.x, c.y - side.y, c.z, c.x + side.x, c.y + side.y, c.z], i * 6);
      sUv.set([0, v / STRAP_W, 1, v / STRAP_W], i * 4);
    }
    strapGeo.attributes.position.needsUpdate = true;
    strapGeo.attributes.uv.needsUpdate = true;
    strapGeo.computeVertexNormals();
    renderer.render(scene, camera);
  }

  // ---- pointer: grab the card anywhere in the hero, tap to flip ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const toWorld = (e: PointerEvent) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray;
  };
  const onCard = (e: PointerEvent) => toWorld(e).intersectObjects([body, front, back]).length > 0;
  const down = (e: PointerEvent) => {
    if (!onCard(e)) return;
    const hit = ray.ray.intersectPlane(plane, new THREE.Vector3());
    if (!hit) return;
    e.preventDefault();
    drag = { off: B.p.clone().sub(hit), target: hit.clone(), x: e.clientX, y: e.clientY, t: performance.now() };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("grabbing");
  };
  const move = (e: PointerEvent) => {
    if (!drag) {
      stage.classList.toggle("over-card", e.pointerType === "mouse" && onCard(e));
      return;
    }
    const hit = toWorld(e).ray.intersectPlane(plane, new THREE.Vector3());
    if (hit) drag.target.copy(hit);
  };
  const release = (e: PointerEvent) => {
    if (!drag) return;
    const tap = Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6 && performance.now() - drag.t < 350;
    drag = null;
    stage.classList.remove("grabbing");
    if (tap) flips = flips ? 0 : 1; // tap: show the other side
  };
  stage.addEventListener("pointerdown", down);
  stage.addEventListener("pointermove", move);
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);

  // ---- run only while visible ----
  let raf = 0, last = performance.now(), acc = 0, visible = true;
  const loop = (now: number) => {
    acc += Math.min(0.05, (now - last) / 1000);
    last = now;
    while (acc >= 1 / 120) {
      step(1 / 120, now / 1000);
      acc -= 1 / 120;
    }
    draw();
    raf = visible ? requestAnimationFrame(loop) : 0;
  };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  });
  io.observe(el);
  const ro = new ResizeObserver(() => layout());
  ro.observe(el);
  raf = requestAnimationFrame(loop);

  const texOf = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
  ready({
    setFaces({ front: f, back: b }) {
      for (const [mesh, c] of [[front, f], [back, b]] as const) {
        const m = mesh.material as InstanceType<typeof THREE.MeshPhysicalMaterial>;
        m.map?.dispose();
        m.map = texOf(c);
        m.needsUpdate = true;
      }
    },
  });

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    stage.removeEventListener("pointerdown", down);
    stage.removeEventListener("pointermove", move);
    stage.removeEventListener("pointerup", release);
    stage.removeEventListener("pointercancel", release);
    renderer.dispose();
    pmrem.dispose();
    renderer.domElement.remove();
  };

  function roundRect<S extends InstanceType<typeof THREE.Path>>(s: S, x: number, y: number, w: number, h: number, r: number): S {
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
}
