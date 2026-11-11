// Escolhe texto escuro ou claro conforme o brilho do fundo (#RRGGBB).
export function corLegivel(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex ?? '')) return '#ffffff';

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brilho = (r * 299 + g * 587 + b * 114) / 1000;

  return brilho > 160 ? '#1f1b2e' : '#ffffff';
}