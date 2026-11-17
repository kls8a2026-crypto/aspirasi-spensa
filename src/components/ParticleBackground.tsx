import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

interface GlassBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  hue: 'cyan' | 'violet' | 'ice';
}

interface GlassRing {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  tilt: number;
  angle: number;
  spin: number;
  alpha: number;
}

interface StarSparkle {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
  isCross: boolean;
}

interface LightArc {
  cxRatio: number;
  cyRatio: number;
  rxRatio: number;
  ryRatio: number;
  rotation: number;
  rotSpeed: number;
  color: string;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const bubbleCount = Math.min(18, Math.max(9, Math.floor(width / 110)));
    const bubbles: GlassBubble[] = Array.from({ length: bubbleCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: -0.12 - Math.random() * 0.22,
      radius: 10 + Math.random() * 24,
      alpha: 0.22 + Math.random() * 0.26,
      hue: i % 3 === 0 ? 'cyan' : i % 3 === 1 ? 'violet' : 'ice',
    }));

    const rings: GlassRing[] = [
      {
        x: width * 0.12,
        y: height * 0.24,
        vx: 0.14,
        vy: 0.08,
        radius: 34,
        tilt: 0.52,
        angle: -0.4,
        spin: 0.0025,
        alpha: 0.34,
      },
      {
        x: width * 0.88,
        y: height * 0.18,
        vx: -0.12,
        vy: 0.1,
        radius: 42,
        tilt: 0.45,
        angle: 0.55,
        spin: -0.002,
        alpha: 0.32,
      },
      {
        x: width * 0.84,
        y: height * 0.82,
        vx: -0.1,
        vy: -0.09,
        radius: 28,
        tilt: 0.56,
        angle: -0.25,
        spin: 0.003,
        alpha: 0.28,
      },
    ];

    const sparkleCount = Math.min(44, Math.max(22, Math.floor(width / 36)));
    const sparkles: StarSparkle[] = Array.from(
      { length: sparkleCount },
      (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: i % 5 === 0 ? 4 + Math.random() * 3.5 : 1.2 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.025,
        isCross: i % 5 === 0,
      })
    );

    const arcs: LightArc[] = [
      {
        cxRatio: 0.5,
        cyRatio: 0.35,
        rxRatio: 0.62,
        ryRatio: 0.24,
        rotation: -0.18,
        rotSpeed: 0.0004,
        color: 'rgba(96, 165, 250, 0.26)',
      },
      {
        cxRatio: 0.48,
        cyRatio: 0.65,
        rxRatio: 0.68,
        ryRatio: 0.26,
        rotation: 0.14,
        rotSpeed: -0.00035,
        color: 'rgba(192, 132, 252, 0.22)',
      },
    ];

    const drawGlassBubble = (b: GlassBubble) => {
      ctx.save();
      ctx.globalAlpha = b.alpha;

      const grad = ctx.createRadialGradient(
        b.x - b.radius * 0.32,
        b.y - b.radius * 0.32,
        b.radius * 0.08,
        b.x,
        b.y,
        b.radius
      );
      if (b.hue === 'cyan') {
        grad.addColorStop(0, 'rgba(224, 242, 254, 0.85)');
        grad.addColorStop(0.45, 'rgba(56, 189, 248, 0.35)');
        grad.addColorStop(1, 'rgba(37, 99, 235, 0.14)');
      } else if (b.hue === 'violet') {
        grad.addColorStop(0, 'rgba(243, 232, 255, 0.8)');
        grad.addColorStop(0.45, 'rgba(167, 139, 250, 0.32)');
        grad.addColorStop(1, 'rgba(79, 70, 229, 0.14)');
      } else {
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        grad.addColorStop(0.5, 'rgba(147, 197, 253, 0.3)');
        grad.addColorStop(1, 'rgba(30, 64, 175, 0.12)');
      }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 1.1;
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.52)';
      ctx.stroke();

      // Specular crescent highlight
      ctx.beginPath();
      ctx.arc(
        b.x - b.radius * 0.3,
        b.y - b.radius * 0.3,
        b.radius * 0.24,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.58)';
      ctx.fill();
      ctx.restore();
    };

    const drawGlassRing = (r: GlassRing) => {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.angle);
      ctx.scale(1, r.tilt);
      ctx.globalAlpha = r.alpha;

      ctx.beginPath();
      ctx.arc(0, 0, r.radius, 0, Math.PI * 2);
      ctx.lineWidth = 7;
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, r.radius, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.68)';
      ctx.stroke();
      ctx.restore();
    };

    const drawSparkle = (s: StarSparkle, time: number) => {
      const twinkle = prefersReducedMotion
        ? 0.75
        : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * s.speed + s.phase));
      ctx.save();
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = '#E0F2FE';

      if (s.isCross) {
        ctx.translate(s.x, s.y);
        ctx.beginPath();
        const rOuter = s.size * 1.45;
        const rInner = s.size * 0.28;
        for (let i = 0; i < 8; i++) {
          const rad = i % 2 === 0 ? rOuter : rInner;
          const a = (i * Math.PI) / 4;
          if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    let frameTick = 0;

    const drawFrame = () => {
      frameTick += 1;
      ctx.clearRect(0, 0, width, height);

      // Orbital luminous light arcs
      for (const arc of arcs) {
        if (!prefersReducedMotion) {
          arc.rotation += arc.rotSpeed;
        }
        ctx.save();
        ctx.translate(width * arc.cxRatio, height * arc.cyRatio);
        ctx.rotate(arc.rotation);
        ctx.beginPath();
        ctx.ellipse(
          0,
          0,
          width * arc.rxRatio,
          Math.max(120, height * arc.ryRatio),
          0,
          0,
          Math.PI * 2
        );
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = arc.color;
        ctx.stroke();
        ctx.restore();
      }

      // Floating hollow glass rings
      for (const r of rings) {
        if (!prefersReducedMotion) {
          r.x += r.vx;
          r.y += r.vy;
          r.angle += r.spin;
          if (r.x < -60) r.x = width + 60;
          if (r.x > width + 60) r.x = -60;
          if (r.y < -60) r.y = height + 60;
          if (r.y > height + 60) r.y = -60;
        }
        drawGlassRing(r);
      }

      // Floating translucent glass spheres
      for (const b of bubbles) {
        if (!prefersReducedMotion) {
          b.x += b.vx;
          b.y += b.vy;
          if (b.x < -40) b.x = width + 40;
          if (b.x > width + 40) b.x = -40;
          if (b.y < -40) b.y = height + 40;
          if (b.y > height + 40) b.y = -40;
        }
        drawGlassBubble(b);
      }

      // Starlight sparkles
      for (const s of sparkles) {
        drawSparkle(s, frameTick);
      }
    };

    if (prefersReducedMotion) {
      drawFrame();
    } else {
      const tick = () => {
        drawFrame();
        animationFrameId = window.requestAnimationFrame(tick);
      };
      animationFrameId = window.requestAnimationFrame(tick);
    }

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden cosmic-canvas"
    >
      <div className="absolute -top-28 -left-24 w-[420px] h-[420px] rounded-full bg-sky-400/20 blur-[90px] animate-cosmic-drift" />
      <div className="absolute top-1/3 -right-24 w-[440px] h-[440px] rounded-full bg-indigo-400/20 blur-[100px] animate-cosmic-drift" />
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
