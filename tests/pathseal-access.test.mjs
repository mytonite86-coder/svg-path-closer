import test from 'node:test';
import assert from 'node:assert/strict';
import { runWithFreshPathSealAccess } from '../modules/pathSealAccess.js';

test('fresh PathSeal and lifetime grants allow protected actions', async () => {
    for (const user of [
        { entitlements: ['pathseal'] },
        { entitlements: ['pathseal'], subscription_status: 'past_due' },
        { entitlements: ['all_products_lifetime'], subscription_status: 'canceled' },
    ]) assert.equal(await runWithFreshPathSealAccess(async () => user, () => 'allowed'), 'allowed');
});

test('signed-out, wrong, missing and malformed entitlements never run paid actions', async () => {
    let calls = 0;
    for (const user of [null, undefined, {}, { entitlements: [] }, { entitlements: ['curve_repair'] }, { entitlements: 'pathseal' }, { entitlements: [42] }]) {
        await assert.rejects(runWithFreshPathSealAccess(async () => user, () => calls++));
    }
    assert.equal(calls, 0);
});

test('expired grants are rejected in all existing subscription status formats', async () => {
    let calls = 0;
    for (const status of ['expired', 'canceled', 'cancelled', 'incomplete_expired', 'paused', 'unpaid']) {
        for (const fields of [{ subscription_status: status }, { subscription_statuses: { pathseal: status } }, { subscriptionStatusByProduct: { pathseal: status } }]) {
            await assert.rejects(runWithFreshPathSealAccess(async () => ({ entitlements: ['pathseal'], ...fields }), () => calls++), { code: 'expired' });
        }
    }
    assert.equal(calls, 0);
});

test('each paid action refreshes authority; revocation and unavailable authority fail closed', async () => {
    let checks = 0, calls = 0;
    let user = { entitlements: ['pathseal'] };
    const refresh = async () => { checks++; return user; };
    await runWithFreshPathSealAccess(refresh, () => calls++);
    user = { entitlements: [] };
    await assert.rejects(runWithFreshPathSealAccess(refresh, () => calls++), { code: 'unentitled' });
    await assert.rejects(runWithFreshPathSealAccess(async () => { throw new Error('offline'); }, () => calls++), { code: 'unavailable' });
    assert.equal(checks, 2);
    assert.equal(calls, 1);
});
