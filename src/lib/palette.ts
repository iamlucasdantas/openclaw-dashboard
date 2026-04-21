// Deriva cores consistentes por identificador — mesmo agente/skill
// sempre gera a mesma cor. Base HSL com luminosidade ajustada pra
// bom contraste em tema escuro.

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function colorForId(id: string): {
  hue: number;
  bg: string;
  ring: string;
  dot: string;
  text: string;
} {
  const hue = hashString(id) % 360;
  return {
    hue,
    bg: `hsl(${hue} 70% 94%)`,
    ring: `hsl(${hue} 70% 45%)`,
    dot: `hsl(${hue} 70% 50%)`,
    text: `hsl(${hue} 70% 30%)`,
  };
}

// Variante pra tema escuro (usa CSS vars? Por ora retorna fallback).
export function colorForIdDark(id: string) {
  const hue = hashString(id) % 360;
  return {
    hue,
    bg: `hsl(${hue} 40% 20%)`,
    ring: `hsl(${hue} 70% 60%)`,
    dot: `hsl(${hue} 70% 60%)`,
    text: `hsl(${hue} 70% 80%)`,
  };
}
