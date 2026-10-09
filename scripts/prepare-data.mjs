import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseDictionary } from '../src/graph/dictionary.ts';

const directory = new URL('../src/data/enable-v1/', import.meta.url);
const source = readFileSync(new URL('enable1.txt', directory));
const notice = readFileSync(new URL('README-enable2k.txt', directory));
const words = parseDictionary(source.toString('utf8'));
const extract = `${words.join('\n')}\n`;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
writeFileSync(new URL('four-letter.txt', directory), extract);
writeFileSync(new URL('metadata.json', directory), `${JSON.stringify({
  id: 'enable-v1',
  name: 'ENABLE (four-letter extract)',
  sourceUrl: 'https://github.com/dolph/dictionary',
  sourceCommit: '233d25a56b9ac8bef906916ccf091a976995cce0',
  sourceFileUrl: 'https://raw.githubusercontent.com/dolph/dictionary/233d25a56b9ac8bef906916ccf091a976995cce0/enable1.txt',
  retrievedDate: '2026-10-08',
  normalization: 'Trim each line, accept ASCII letters only with length 4, lowercase, deduplicate, sort; LF with final newline.',
  normalizedWordCount: words.length,
  sourceSha256: sha256(source),
  extractSha256: sha256(extract),
  permission: 'Public-domain dedication stated in the ENABLE documentation; the dolph mirror does not include a separate license file.',
  permissionNoticeUrl: 'https://raw.githubusercontent.com/BartMassey/wordlists/af52415c13af809bd8757a40f17f46e79d09583c/README-enable2k.txt',
  permissionNoticeSha256: sha256(notice),
  attribution: 'ENABLE compiled by Alan Beale and M. Cooper; word-list mirror maintained by dolph.',
  officialPoopleDictionary: false,
}, null, 2)}\n`);
console.log(`Prepared ${words.length} four-letter words.`);
