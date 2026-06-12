/**
 * Test all Syntx non-Claude models using exact model_type from API
 */
require('dotenv').config();
const syntxBot = require('./syntx-bot');

const ALL_MODELS = [
  // ChatGPT
  'gpt-5-nano-2025-08-07',
  'gpt-5-mini-2025-08-07',
  'gpt-5-2025-08-07',
  'gpt-5.1',
  'gpt-5.4',
  'gpt-5.3-chat-latest',
  'gpt-5.2',
  'gpt-4.1-2025-04-14',
  'gpt-4.1-nano-2025-04-14',
  'gpt-4.1-mini-2025-04-14',
  'gpt-5.5',
  'gpt-5.4-pro',
  // Gemini
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-3.1-pro-preview',
  // Grok
  'grok-4',
  'grok-4.3',
  'grok-3',
  'grok-3-reasoner',
  'grok-3-deepsearch',
  // Deepseek
  'deepseek-r1',
  'deepseek-v3',
  // Qwen
  'qwen3-235b-a22b',
  'qwen3-vl-30b-a3b-thinking',
  'qwen3-max-2026-01-23',
  'qwen3.7-max',
  'qwen3.7-plus',
  // Perplexity
  'sonar-pro',
  'sonar-deep-research',
  'sonar',
];

async function testModel(model) {
  try {
    console.log(`\n🧪 Testing: ${model}`);
    const result = await syntxBot.callSyntx(
      'Reply with exactly one word: OK',
      model,
      {},
      null
    );
    const reply = (result || '').slice(0, 100);
    const isRealReply = !reply.toLowerCase().includes('oops') && !reply.toLowerCase().includes('something went wrong');
    if (isRealReply) {
      console.log(`✅ ${model} → WORKS → "${reply}"`);
      return { model, works: true, reply };
    } else {
      console.log(`⚠️ ${model} → DEPRECATED → "${reply}"`);
      return { model, works: false, reason: 'deprecated' };
    }
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('402') || msg.includes('Insufficient tokens')) {
      console.log(`❌ ${model} → PAID ONLY (402)`);
      return { model, works: false, reason: 'paid_only' };
    } else if (msg.includes('not found') || msg.includes('Available:')) {
      console.log(`❌ ${model} → NOT FOUND`);
      return { model, works: false, reason: 'not_found' };
    } else if (msg.includes('rate-limited') || msg.includes('429') || msg.includes('semua akun')) {
      console.log(`⚠️ ${model} → RATE LIMITED`);
      return { model, works: false, reason: 'rate_limited' };
    } else {
      console.log(`⚠️ ${model} → ERROR: ${msg.slice(0, 150)}`);
      return { model, works: false, reason: msg.slice(0, 150) };
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  SYNTX NON-CLAUDE MODEL TEST');
  console.log('═══════════════════════════════════════════');
  console.log(`Testing ${ALL_MODELS.length} models...\n`);

  const results = [];
  for (const model of ALL_MODELS) {
    const result = await testModel(model);
    results.push(result);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('  RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════');
  
  const working = results.filter(r => r.works);
  const deprecated = results.filter(r => !r.works && r.reason === 'deprecated');
  const paidOnly = results.filter(r => !r.works && r.reason === 'paid_only');
  const notFound = results.filter(r => !r.works && r.reason === 'not_found');
  const rateLimited = results.filter(r => !r.works && r.reason === 'rate_limited');
  const otherErrors = results.filter(r => !r.works && !['deprecated','paid_only','not_found','rate_limited'].includes(r.reason));

  console.log(`\n✅ WORKING (${working.length}):`);
  working.forEach(r => console.log(`   ${r.model} → "${r.reply}"`));
  
  if (deprecated.length > 0) {
    console.log(`\n⚠️ DEPRECATED (${deprecated.length}):`);
    deprecated.forEach(r => console.log(`   ${r.model}`));
  }
  if (paidOnly.length > 0) {
    console.log(`\n💰 PAID ONLY (${paidOnly.length}):`);
    paidOnly.forEach(r => console.log(`   ${r.model}`));
  }
  if (rateLimited.length > 0) {
    console.log(`\n⏳ RATE LIMITED (${rateLimited.length}):`);
    rateLimited.forEach(r => console.log(`   ${r.model}`));
  }
  if (notFound.length + otherErrors.length > 0) {
    console.log(`\n❌ ERROR (${notFound.length + otherErrors.length}):`);
    [...notFound, ...otherErrors].forEach(r => console.log(`   ${r.model} → ${r.reason}`));
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('Working model names:');
  console.log(JSON.stringify(working.map(r => r.model), null, 2));
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
