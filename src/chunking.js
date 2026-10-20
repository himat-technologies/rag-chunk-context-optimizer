export const STRATEGIES = [
  { value: 'recursive', label: 'Recursive splitting', description: 'Paragraphs → lines → words → characters' },
  { value: 'sentence', label: 'Sentence / paragraph', description: 'Prefer readable sentence boundaries' },
  { value: 'heading', label: 'Semantic headings', description: 'Keep Markdown sections together' },
  { value: 'fixed', label: 'Fixed character windows', description: 'Predictable windows for comparisons' },
];

function splitUnits(text, strategy) {
  if (strategy === 'fixed') return [...text];
  if (strategy === 'heading') {
    const lines = text.split(/(?=^#{1,4}\s)/m);
    return lines.filter(Boolean);
  }
  if (strategy === 'sentence') {
    return text.split(/(?<=[.!?])\s+|\n\s*\n/).filter(Boolean);
  }
  return text.split(/(?<=\n\n)|(?<=\n)|(?<=\s)/).filter(Boolean);
}

export function chunkText(text, chunkSize = 500, overlap = 50, strategy = 'recursive') {
  const input = String(text ?? '');
  const size = Math.max(1, Math.floor(Number(chunkSize) || 1));
  const overlapSize = Math.min(Math.max(0, Math.floor(Number(overlap) || 0)), size - 1);
  if (!input.length) return [];
  if (strategy === 'fixed') {
    const result = [];
    let start = 0;
    while (start < input.length) {
      const end = Math.min(start + size, input.length);
      result.push({ text: input.slice(start, end), start, end, overlap: result.length ? Math.max(0, result[result.length - 1].end - start) : 0 });
      if (end === input.length) break;
      start = Math.max(start + 1, end - overlapSize);
    }
    return result;
  }
  const units = splitUnits(input, strategy);
  const result = [];
  let current = '';
  let start = 0;
  let cursor = 0;
  const push = () => {
    if (!current) return;
    const end = start + current.length;
    result.push({ text: current, start, end, overlap: result.length ? Math.max(0, result[result.length - 1].end - start) : 0 });
    current = '';
  };
  for (const unit of units) {
    // If an indivisible unit is larger than the target, split it safely without losing characters.
    if (unit.length > size) {
      push();
      let offset = 0;
      while (offset < unit.length) {
        const piece = unit.slice(offset, offset + size);
        result.push({ text: piece, start: cursor + offset, end: cursor + offset + piece.length, overlap: 0 });
        offset += Math.max(1, size - overlapSize);
      }
      cursor += unit.length;
      start = cursor;
      continue;
    }
    if (current.length && current.length + unit.length > size) {
      push();
      const carry = overlapSize ? input.slice(Math.max(0, cursor - overlapSize), cursor) : '';
      current = carry;
      start = cursor - carry.length;
    }
    if (!current) start = cursor;
    current += unit;
    cursor += unit.length;
  }
  push();
  // Normalize chunk offsets to their actual occurrence in source where possible.
  let searchFrom = 0;
  return result.map((item, i) => {
    const found = input.indexOf(item.text, Math.max(0, searchFrom - overlapSize));
    const actualStart = found >= 0 ? found : item.start;
    searchFrom = Math.max(searchFrom, actualStart + item.text.length);
    return { ...item, start: actualStart, end: actualStart + item.text.length, overlap: i ? Math.max(0, result[i - 1].end - actualStart) : 0 };
  });
}

export function estimateTokens(text) {
  // A transparent heuristic, not model-specific tokenization.
  const s = String(text ?? '');
  if (!s.trim()) return 0;
  const words = s.trim().split(/\s+/).length;
  const nonAscii = (s.match(/[^\x00-\x7F]/g) || []).length;
  return Math.max(1, Math.ceil(s.length / 4), Math.ceil(words * 1.25), Math.ceil(nonAscii / 2));
}

export function getChunkStats(chunks) {
  if (!chunks.length) return { count: 0, characters: 0, tokens: 0, average: 0, largest: 0 };
  const sizes = chunks.map(c => c.text.length);
  return {
    count: chunks.length,
    characters: chunks.reduce((sum, c) => sum + c.text.length, 0),
    tokens: chunks.reduce((sum, c) => sum + estimateTokens(c.text), 0),
    average: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
    largest: Math.max(...sizes),
  };
}
