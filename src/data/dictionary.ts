import text from './enable-v1/four-letter.txt?raw';
import metadata from './enable-v1/metadata.json';
import { parseDictionary } from '../graph/dictionary';
import { buildGraph } from '../graph/topology';

export { metadata };
export const graph = buildGraph(parseDictionary(text));
