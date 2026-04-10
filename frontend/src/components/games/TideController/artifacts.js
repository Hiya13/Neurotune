/** Scene coordinates use viewBox 0 0 1000 700 (unitless SVG). */

export const SCENE_WIDTH = 1000;
export const SCENE_HEIGHT = 700;

/**
 * Y aligned with tide model: surfaceY = H * (0.1 + 0.8 * score/100)
 * so each artifact emerges near its threshold score.
 */
export const ARTIFACTS = [
  {
    id: 'coin',
    name: 'Ancient Coin',
    threshold: 30,
    x: 130,
    y: 238,
    story:
      'Salt has eaten the king’s face, yet the ring of gold still catches the sun like a whisper of old trade routes. You imagine palms closing over it the last time the tide was this forgiving.',
    glyph: '◎',
  },
  {
    id: 'compass',
    name: 'Compass Rose',
    threshold: 42,
    x: 300,
    y: 305,
    story:
      'The glass is frosted and the needle trembles, but the rose still remembers north. For a breath you feel oriented — not by maps, but by the steady pull of your own attention.',
    glyph: '✧',
  },
  {
    id: 'bottle',
    name: 'Message in a Bottle',
    threshold: 55,
    x: 470,
    y: 378,
    story:
      'The cork is swollen and the parchment curls, ink bled into blue stains. Whatever it once said is gone; only patience could have carried it this far beneath the waves.',
    glyph: '⌾',
  },
  {
    id: 'sextant',
    name: 'Brass Sextant',
    threshold: 63,
    x: 620,
    y: 453,
    story:
      'Arc and mirrors tarnished green, it measured stars for sailors who trusted angles more than myths. Holding it, you notice how finely your focus can slice through noise.',
    glyph: '⌒',
  },
  {
    id: 'amulet',
    name: 'Jade Amulet',
    threshold: 74,
    x: 780,
    y: 514,
    story:
      'Cool even in sun-warmed air, the jade is carved with a knot that never ends. Legends call it protection; today it feels like a quiet reward for staying present.',
    glyph: '◆',
  },
  {
    id: 'figurehead',
    name: 'Shipwreck Figurehead',
    threshold: 85,
    x: 900,
    y: 546,
    story:
      'Her paint is stripped to ghosts, smile worn to wood grain. She rode a hull through storms; now she watches the tide with you, patient as any wreck become reef.',
    glyph: '⚓',
  },
];
