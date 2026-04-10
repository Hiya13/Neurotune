import { SCENE_HEIGHT, SCENE_WIDTH } from './artifacts.js';

/**
 * Static coastal backdrop: gradient sky, drifting clouds, headland, sand, rocks, seaweed.
 */
export default function SceneCanvas() {
  return (
    <g>
      <defs>
        <linearGradient id="tide-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9ecfff" />
          <stop offset="45%" stopColor="#d4e8ff" />
          <stop offset="100%" stopColor="#f0e6d8" />
        </linearGradient>
        <linearGradient id="tide-sand" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e8d4b8" />
          <stop offset="100%" stopColor="#c9a882" />
        </linearGradient>
        <filter id="tide-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
        </filter>
      </defs>

      <rect x={0} y={0} width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="url(#tide-sky)" />

      <g opacity={0.88}>
        <ellipse className="tide-cloud tide-cloud-slow" cx={180} cy={95} rx={90} ry={28} fill="rgba(255,255,255,0.75)" />
        <ellipse className="tide-cloud tide-cloud-slow" cx={200} cy={88} rx={55} ry={18} fill="rgba(255,255,255,0.65)" />
        <ellipse className="tide-cloud tide-cloud-mid" cx={520} cy={120} rx={100} ry={32} fill="rgba(255,255,255,0.7)" />
        <ellipse className="tide-cloud tide-cloud-mid" cx={540} cy={112} rx={60} ry={20} fill="rgba(255,255,255,0.6)" />
        <ellipse className="tide-cloud tide-cloud-fast" cx={820} cy={75} rx={75} ry={24} fill="rgba(255,255,255,0.72)" />
        <ellipse className="tide-cloud tide-cloud-fast" cx={835} cy={70} rx={45} ry={16} fill="rgba(255,255,255,0.58)" />
      </g>

      <path
        d="M 0 320 Q 120 280 260 300 T 520 295 T 780 310 T 1000 300 L 1000 380 L 0 380 Z"
        fill="#1a2a35"
        opacity={0.92}
      />
      <path
        d="M 0 340 Q 200 310 420 335 T 1000 325 L 1000 400 L 0 400 Z"
        fill="#0f1820"
        opacity={0.85}
      />

      <rect x={0} y={380} width={SCENE_WIDTH} height={320} fill="url(#tide-sand)" />

      <ellipse cx={120} cy={620} rx={38} ry={14} fill="#8a7355" opacity={0.55} />
      <ellipse cx={340} cy={640} rx={52} ry={18} fill="#7a6548" opacity={0.5} />
      <ellipse cx={720} cy={630} rx={44} ry={15} fill="#8a7355" opacity={0.52} />
      <ellipse cx={900} cy={655} rx={36} ry={12} fill="#6d5a42" opacity={0.5} />

      <g stroke="#2d5a45" strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.65}>
        <path d="M 200 620 Q 208 580 198 540" />
        <path d="M 205 618 Q 218 575 212 548" />
        <path d="M 550 650 Q 562 600 548 555" />
        <path d="M 558 648 Q 568 605 560 565" />
        <path d="M 420 635 Q 428 595 418 558" />
      </g>

      <g filter="url(#tide-soft)" opacity={0.35}>
        <ellipse cx={160} cy={610} rx={120} ry={8} fill="rgba(40,80,70,0.4)" />
        <ellipse cx={500} cy={625} rx={160} ry={10} fill="rgba(40,80,70,0.35)" />
        <ellipse cx={820} cy={615} rx={140} ry={9} fill="rgba(40,80,70,0.38)" />
      </g>
    </g>
  );
}
