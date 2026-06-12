/**
 * Test all available Syntx models one by one
 * Uses existing pool accounts to test each model
 */
require('dotenv').config();
const syntxBot = require('./syntx-bot');

// All known Syntx model names (from API error response)
const ALL_MODELS = [
  // Claude models
  'claude-3-5-haiku-20241022',
  'claude-3-5-sonnet-20241022',
  'claude-3-opus-20240229',
  'claude-3-7-sonnet-20250219',
  'claude-3-7-sonnet-20250219-thinking',
  'claude-opus-4-1-20250805',
  'claude-opus-4-20250514',
  'claude-opus-4-5-20251101',
  'claude-opus-4-6',
  'claude-opus-4-7',
  'claude-opus-4-8',
  'claude-sonnet-4-20250514',
  'claude-sonnet-4-5-20250929',
  'claude-sonnet-4-6',
  'claude-fable-5',
  // Gemini models (try various names)
  'gemini-3.5-flash',
  'gemini-flash-2-0',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  // ChatGPT models
  'gpt-4o',
  'gpt-4o-mini',
  'o3-mini',
  // Grok
  'grok-3',
  'grok-4',
  // Deepseek
  'deepseek-chat',
  'deepseek-r1',
  // Perplexity
  'sonar-large',
  'sonar-pro',
  // Qwen
  'qwen-max',
  'qwen-plus',
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
    console.log(`✅ ${model} → WORKS → "${reply}"`);
    return { model, works: true, reply };
  } catch (err) {
    const msg = err.message || '';
    // Check if it's a "model not found" error vs rate limit
    if (msg.includes('not found') || msg.includes('Available:')) {
      console.log(`❌ ${model} → NOT AVAILABLE`);
      return { model, works: false, reason: 'not_found' };
    } else if (msg.includes('rate-limited') || msg.includes('429') || msg.includes('semua akun')) {
      console.log(`⚠️ ${model} → RATE LIMITED (may work, try later)`);
      return { model, works: false, reason: 'rate_limited' };
    } else if (msg.includes('400')) {
      console.log(`❌ ${model} → HTTP 400 (bad request)`);
      return { model, works: false, reason: 'bad_request' };
    } else if (msg.includes('401')) {
      console.log(`❌ ${model} → HTTP 401 (unauthorized)`);
      return { model, works: false, reason: 'unauthorized' };
    } else {
      console.log(`⚠️ ${model} → ERROR: ${msg.slice(0, 120)}`);
      return { model, works: false, reason: msg.slice(0, 120) };
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  SYNTX MODEL COMPATIBILITY TEST');
  console.log('═══════════════════════════════════════════');
  console.log(`Testing ${ALL_MODELS.length} models...\n`);

  // Ensure we have accounts
  const status = syntxBot.getPoolStatus();
  console.log(`Pool: ${status.activeAccountsCount}/${status.totalAccountsCount} active accounts`);
  
  if (status.activeAccountsCount === 0) {
    console.log('No active accounts. Creating one...');
    try {
      await syntxBot.loginAndGetToken({});
      console.log('Account created.');
    } catch (e) {
      console.error('Failed to create account:', e.message);
      process.exit(1);
    }
  }

  const results = [];
  for (const model of ALL_MODELS) {
    const result = await testModel(model);
    results.push(result);
    // Small delay between tests to avoid rate limits
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('  RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════');
  
  const working = results.filter(r => r.works);
  const notFound = results.filter(r => !r.works && r.reason === 'not_found');
  const rateLimited = results.filter(r => !r.works && r.reason === 'rate_limited');
  const otherErrors = results.filter(r => !r.works && r.reason !== 'not_found' && r.reason !== 'rate_limited');

  console.log(`\n✅ WORKING (${working.length}):`);
  working.forEach(r => console.log(`   ${r.model} → "${r.reply}"`));
  
  if (rateLimited.length > 0) {
    console.log(`\n⚠️ RATE LIMITED (${rateLimited.length}):`);
    rateLimited.forEach(r => console.log(`   ${r.model}`));
  }
  
  console.log(`\n❌ NOT FOUND / ERROR (${notFound.length + otherErrors.length}):`);
  [...notFound, ...otherErrors].forEach(r => console.log(`   ${r.model} → ${r.reason}`));

  console.log('\n═══════════════════════════════════════════');
  console.log('Working model names (for system config):');
  console.log(JSON.stringify(working.map(r => r.model), null, 2));
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
