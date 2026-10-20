import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkText, estimateTokens, getChunkStats } from '../src/chunking.js';

test('empty input returns no chunks', () => assert.deepEqual(chunkText('', 100, 10, 'fixed'), []));
test('fixed splitting preserves source characters when overlap is zero', () => {
  const source = 'abcdefghij'; const chunks = chunkText(source, 3, 0, 'fixed');
  assert.equal(chunks.map(c => c.text).join(''), source);
});
test('fixed splitting respects target size and overlap', () => {
  const chunks = chunkText('abcdefghijklmnop', 6, 2, 'fixed');
  assert.ok(chunks.every(c => c.text.length <= 6));
  assert.equal(chunks[0].text, 'abcdef');
  assert.equal(chunks[1].text, 'efghij');
});
test('all strategies produce chunks for non-empty text', () => {
  const source = '# Title\n\nFirst sentence. Second sentence.\n\n## Next\nMore words.';
  for (const strategy of ['recursive', 'sentence', 'heading', 'fixed']) assert.ok(chunkText(source, 20, 3, strategy).length > 0);
});
test('token estimate is zero for blank input and positive for text', () => {
  assert.equal(estimateTokens('   '), 0); assert.ok(estimateTokens('hello world') > 0);
});
test('stats summarize chunks', () => {
  const stats = getChunkStats([{text:'abcd'}, {text:'ef'}]);
  assert.equal(stats.count, 2); assert.equal(stats.characters, 6); assert.equal(stats.largest, 4); assert.equal(stats.average, 3);
});
