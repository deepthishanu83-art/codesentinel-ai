/**
 * AnimatedBackground
 *
 * Creates a subtle, premium animated background system with:
 * 1. Deep charcoal / midnight base.
 * 2. 4 large blurred abstract gradient shapes using muted Violet, Indigo, Teal, and Cyan.
 * 3. Smooth, slow-moving CSS keyframe animations (25s - 38s duration).
 * 4. Subtle opacity pulsing/variations.
 * 5. SVG noise/grain layer.
 * 6. Accessibility support: respects `prefers-reduced-motion` to stop drift animations.
 */
export default function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
      style={{ background: '#090c15' }}
    >
      {/* ── Base Gradient Overlay ────────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: 'radial-gradient(circle at 50% 0%, #0d1222 0%, #090c15 70%)',
        }}
      />

      {/* ── Tech background image ────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: 'url(/tech-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.35,
        }}
      />

      {/* ── Noise / Grain Texture Layer ─────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* ── Subtle Mesh Grid ────────────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* ── Shape 1: Muted Violet (Top-Left) ────────────────────────── */}
      <div
        className="absolute rounded-full"
        style={{
          top: '-15%',
          left: '-10%',
          width: '55vw',
          height: '55vw',
          maxWidth: '750px',
          maxHeight: '750px',
          background: 'radial-gradient(circle, rgba(112, 58, 222, 0.16) 0%, rgba(88, 28, 135, 0.05) 50%, transparent 70%)',
          filter: 'blur(90px)',
          animation: 'bgDriftViolet 32s ease-in-out infinite',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Shape 2: Deep Indigo (Bottom-Right) ────────────────────── */}
      <div
        className="absolute rounded-full"
        style={{
          bottom: '-20%',
          right: '-10%',
          width: '60vw',
          height: '60vw',
          maxWidth: '850px',
          maxHeight: '850px',
          background: 'radial-gradient(circle, rgba(49, 46, 129, 0.22) 0%, rgba(30, 27, 75, 0.08) 55%, transparent 75%)',
          filter: 'blur(100px)',
          animation: 'bgDriftIndigo 38s ease-in-out infinite',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Shape 3: Muted Teal (Top-Right) ────────────────────────── */}
      <div
        className="absolute rounded-full"
        style={{
          top: '5%',
          right: '-5%',
          width: '45vw',
          height: '45vw',
          maxWidth: '600px',
          maxHeight: '600px',
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.14) 0%, rgba(15, 118, 110, 0.04) 50%, transparent 70%)',
          filter: 'blur(85px)',
          animation: 'bgDriftTeal 28s ease-in-out infinite',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Shape 4: Soft Cyan (Center-Left / Middle) ─────────────── */}
      <div
        className="absolute rounded-full"
        style={{
          top: '40%',
          left: '10%',
          width: '40vw',
          height: '40vw',
          maxWidth: '520px',
          maxHeight: '520px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(14, 116, 144, 0.03) 50%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'bgDriftCyan 25s ease-in-out infinite',
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Keyframes & Reduced Motion CSS ───────────────────────────── */}
      <style>{`
        @keyframes bgDriftViolet {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
            opacity: 0.85;
          }
          33% {
            transform: translate(45px, -35px) scale(1.06);
            opacity: 1;
          }
          66% {
            transform: translate(-30px, 25px) scale(0.95);
            opacity: 0.75;
          }
        }

        @keyframes bgDriftIndigo {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
            opacity: 0.8;
          }
          40% {
            transform: translate(-50px, 30px) scale(1.08);
            opacity: 1;
          }
          75% {
            transform: translate(25px, -20px) scale(0.94);
            opacity: 0.7;
          }
        }

        @keyframes bgDriftTeal {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
            opacity: 0.9;
          }
          30% {
            transform: translate(-30px, 40px) scale(1.05);
            opacity: 0.75;
          }
          65% {
            transform: translate(20px, -25px) scale(0.96);
            opacity: 1;
          }
        }

        @keyframes bgDriftCyan {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
            opacity: 0.75;
          }
          45% {
            transform: translate(35px, -30px) scale(1.07);
            opacity: 1;
          }
          80% {
            transform: translate(-25px, 15px) scale(0.93);
            opacity: 0.65;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          div[style*="animation:"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
