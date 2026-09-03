import test from 'node:test';
import assert from 'node:assert/strict';
import { hashBlob, encryptionAssertion } from '../src/evidence-integrity.js';

test('hashBlob hashes actual bytes',async()=>{const blob=new Blob(['IPX evidence']);const result=await hashBlob(blob);assert.equal(result.byte_size,12);assert.match(result.content_hash,/^[a-f0-9]{64}$/);});
test('encryption assertion distinguishes provider and envelope encryption',()=>{assert.equal(encryptionAssertion({providerAtRest:true}).encryption_mode,'provider-at-rest');assert.equal(encryptionAssertion({clientEnvelope:true,keyReference:'k1'}).encryption_mode,'client-envelope');assert.equal(encryptionAssertion().encrypted,false);});
