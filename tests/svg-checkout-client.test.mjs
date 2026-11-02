import assert from 'node:assert/strict';
import test from 'node:test';
import { PRODUCT_MANIFEST, SVG_PURCHASE_CATALOG } from '../modules/productManifest.js';
import { RELEASE_FLAGS } from '../modules/releaseFlags.js';
import { readFile } from 'node:fs/promises';

async function client(token = 'isolated-token') {
    const values = new Map(token ? [['svg-micro-eco-access-token', token], ['svg-micro-eco-user', '{"entitlements":[]}']] : []);
    globalThis.localStorage = { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
    const assigned = [];
    globalThis.window = { location: { origin: 'https://mytonite86-coder.github.io', pathname: '/svg-path-closer/index.html', assign: url => assigned.push(url) } };
    const auth = await import(`../modules/auth.js?checkout=${Math.random()}`);
    return { auth, assigned };
}

test('recovered client sends each implemented ID and the complete bundle to shared checkout', async () => {
    const { auth, assigned } = await client();
    const requests = [];
    globalThis.fetch = async (...args) => { requests.push(args); return { ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_fixture' }) }; };
    for (const selection of [...SVG_PURCHASE_CATALOG.map(p => [p.id]), PRODUCT_MANIFEST.map(p => p.id)]) {
        await auth.startSvgSubscriptionCheckout(selection);
        const [url, options] = requests.at(-1);
        assert.match(url, /\/payments\/svg-subscription\/checkout\/session$/);
        assert.equal(options.headers.Authorization, 'Bearer isolated-token');
        assert.deepEqual(JSON.parse(options.body), { selected_product_ids: selection, origin_url: 'https://mytonite86-coder.github.io/svg-path-closer/index.html' });
    }
    assert.equal(assigned.length, 7);
    assert.deepEqual(auth.getCurrentUser().entitlements, [], 'checkout never grants client-side entitlement');
});

test('signed-out and invalid selections fail before any checkout request', async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; throw Error('unexpected fetch'); };
    let { auth } = await client(null);
    await assert.rejects(auth.startSvgSubscriptionCheckout(['curve_repair']), /Sign in required/);
    ({ auth } = await client());
    for (const ids of [[], ['pathseal', 'pathseal'], ['mab_s1'], ['unknown'], null]) await assert.rejects(auth.startSvgSubscriptionCheckout(ids));
    assert.equal(calls, 0);
});

test('unsafe redirects and backend failures never navigate', async () => {
    const { auth, assigned } = await client();
    for (const url of ['https://attacker.example', 'http://checkout.stripe.com', 'https://checkout.stripe.com.attacker.example', null]) {
        globalThis.fetch = async () => ({ ok: true, json: async () => ({ url }) });
        await assert.rejects(auth.startSvgSubscriptionCheckout(['curve_repair']), /safe destination/);
    }
    globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({ detail: 'Checkout is disabled' }) });
    await assert.rejects(auth.startSvgSubscriptionCheckout(['curve_repair']), /disabled/);
    assert.deepEqual(assigned, []);
});

test('checkout return uses owner-scoped status then authoritative session refresh', async () => {
    const { auth } = await client();
    const paths = [];
    globalThis.fetch = async url => {
        paths.push(url);
        return { ok: true, json: async () => url.endsWith('/auth/me') ? { entitlements: ['curve_repair'] } : { payment_status: 'paid' } };
    };
    const result = await auth.confirmSvgSubscriptionCheckout('cs_fixture');
    assert.deepEqual(paths.map(url => new URL(url).pathname), ['/api/payments/checkout/status/cs_fixture', '/api/auth/me']);
    assert.deepEqual(result.user.entitlements, ['curve_repair']);
    await assert.rejects(auth.confirmSvgSubscriptionCheckout(''), /required/);
});

test('public checkout stays hidden, disabled and behind false release flag', async () => {
    assert.equal(RELEASE_FLAGS.svgSubscriptionCheckout, false);
    assert.ok(PRODUCT_MANIFEST.slice(1).every(p => !p.productionEnabled));
    const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
    assert.match(html, /id="subscription-checkout"[^>]*hidden disabled/);
    const controller = await readFile(new URL('../ecosystem.js', import.meta.url), 'utf8');
    assert.match(controller, /if \(!RELEASE_FLAGS.svgSubscriptionCheckout \|\| checkoutButton.disabled\) return/);
});
