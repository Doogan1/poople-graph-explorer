import { normalizeWord } from './dictionary.ts';

export interface WordGraph {
  readonly words: readonly string[];
  readonly adjacency: ReadonlyMap<string, readonly string[]>;
  readonly edgeCount: number;
  readonly components: readonly (readonly string[])[];
  readonly componentByWord: ReadonlyMap<string, number>;
}

export function differsByOne(a: string, b: string): boolean {
  if (a.length !== 4 || b.length !== 4) return false;
  let differences = 0;
  for (let index = 0; index < 4; index++) {
    if (a[index] !== b[index]) differences++;
  }
  return differences === 1;
}

export function buildGraph(input: readonly string[]): WordGraph {
  const normalized = input.map((value) => {
    const word = normalizeWord(value);
    if (word === null) throw new Error(`Invalid four-letter word: ${value}`);
    return word;
  });
  const words = [...new Set(normalized)].sort();
  const buckets = new Map<string, string[]>();
  const neighborSets = new Map(words.map((word) => [word, new Set<string>()]));
  for (const word of words) {
    for (let index = 0; index < 4; index++) {
      const pattern = `${word.slice(0, index)}*${word.slice(index + 1)}`;
      const bucket = buckets.get(pattern) ?? [];
      for (const neighbor of bucket) {
        neighborSets.get(word)!.add(neighbor);
        neighborSets.get(neighbor)!.add(word);
      }
      bucket.push(word);
      buckets.set(pattern, bucket);
    }
  }
  const adjacency = new Map(words.map((word) => [word, Object.freeze([...neighborSets.get(word)!].sort())]));
  const components: (readonly string[])[] = [];
  const componentByWord = new Map<string, number>();
  for (const word of words) {
    if (componentByWord.has(word)) continue;
    const componentId = components.length;
    const queue = [word];
    componentByWord.set(word, componentId);
    for (let head = 0; head < queue.length; head++) {
      for (const neighbor of adjacency.get(queue[head]!)!) {
        if (componentByWord.has(neighbor)) continue;
        componentByWord.set(neighbor, componentId);
        queue.push(neighbor);
      }
    }
    components.push(Object.freeze(queue.sort()));
  }
  const edgeCount = [...adjacency.values()].reduce((total, neighbors) => total + neighbors.length, 0) / 2;
  return { words: Object.freeze(words), adjacency, edgeCount, components: Object.freeze(components), componentByWord };
}
