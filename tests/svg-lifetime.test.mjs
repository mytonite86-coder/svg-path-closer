import test from 'node:test';
import assert from 'node:assert/strict';
import { SVG_PURCHASE_CATALOG } from '../modules/productManifest.js';
import { runWithFreshPathSealAccess } from '../modules/pathSealAccess.js';
import { runWithFreshDuplicateGeometryAccess } from '../modules/duplicateGeometryAccess.js';
import { runWithFreshStrayNodeAccess } from '../modules/strayNodeAccess.js';
import { runWithFreshOverlappingAccess } from '../modules/overlappingShapeAccess.js';
import { runWithFreshCurveAccess } from '../modules/curveAccess.js';

test('six approved one-time catalog entries preserve amounts and exact Price IDs',()=>{
    assert.deepEqual(SVG_PURCHASE_CATALOG.map(p=>p.priceId),['price_1UWR05GcjYPS3asvfYYyOfNb','price_1UWR0DGcjYPS3asvaIMuvUjo','price_1UWR0EGcjYPS3asvvzGDU6eH','price_1UWR0GGcjYPS3asvGXEkZ9LB','price_1UWR0IGcjYPS3asvPdIxw729','price_1UWR0KGcjYPS3asvWLg8MvVb']);
    assert.deepEqual(SVG_PURCHASE_CATALOG.map(p=>p.amountCents),[999,999,999,999,999,3499]);
    assert.ok(SVG_PURCHASE_CATALOG.every(p=>p.billingMode==='payment'&&p.access==='lifetime'));
});

test('fresh per-tool lifetime access survives old subscription expiry; revoked or offline access fails closed',async()=>{
    const gates=[runWithFreshPathSealAccess,runWithFreshDuplicateGeometryAccess,runWithFreshStrayNodeAccess,runWithFreshOverlappingAccess,runWithFreshCurveAccess];
    for(const [i,gate] of gates.entries()){
        const id=SVG_PURCHASE_CATALOG[i].id;
        let calls=0;
        const user={entitlements:[id],svg_lifetime_entitlements:[id],subscription_status:'canceled',subscription_statuses:{[id]:'canceled'}};
        await gate(async()=>user,()=>calls++);
        await assert.rejects(gate(async()=>({...user,entitlements:[]}),()=>calls++));
        await assert.rejects(gate(async()=>{throw Error('offline')},()=>calls++));
        assert.equal(calls,1);
    }
});
