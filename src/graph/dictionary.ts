export function normalizeWord(word: string): string | null {
  const trimmed = word.trim();
  return /^[a-zA-Z]{4}$/.test(trimmed) ? trimmed.toLowerCase() : null;
}

export function parseDictionary(text: string): string[] {
  const words = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const word = normalizeWord(line);
    if (word !== null) words.add(word);
  }
  return [...words].sort();
}
