import test from 'node:test';
import assert from 'node:assert/strict';
import {webApp} from './helpers/web-app.mjs';

test('Web validation errors translate immediately and clear when the message changes',async()=>{
  const app=webApp();await app.click('#analyze');
  assert.match(app.get('#input-error').textContent,/Paste a message/);
  await app.change('#language','ta');assert.match(app.get('#input-error').textContent,/முதலில்/);
  await app.change('#language','en');assert.match(app.get('#input-error').textContent,/Paste a message/);
  await app.input('#message','Hello there');assert.equal(app.get('#input-error').textContent,'');
  await app.change('#language','ta');assert.equal(app.get('#input-error').textContent,'');
});

test('Web length errors stay distinct and translate without reviving stale results',async()=>{
  const app=webApp();await app.input('#message','send OTP');await app.click('#analyze');
  assert.equal(app.get('#result-content').hidden,false);
  await app.input('#message','x'.repeat(12001));await app.click('#analyze');
  assert.equal(app.get('#result-content').hidden,true);
  assert.match(app.get('#input-error').textContent,/12,000/);
  await app.change('#language','ta');assert.match(app.get('#input-error').textContent,/எழுத்துகளுக்குள்/);
  assert.equal(app.get('#result-content').hidden,true);
});

test('A web rendering failure has a translated recovery message and no stale result',async()=>{
  const app=webApp();await app.input('#message','send OTP');
  const append=app.get('#reasons').append;
  app.get('#reasons').append=()=>{throw Error('DOM unavailable');};
  await app.click('#analyze');assert.equal(app.get('#result-content').hidden,true);
  assert.match(app.get('#input-error').textContent,/could not finish/);
  await app.change('#language','ta');assert.match(app.get('#input-error').textContent,/முடிக்க முடியவில்லை/);
  app.get('#reasons').append=append;await app.click('#analyze');
  assert.equal(app.get('#input-error').textContent,'');assert.equal(app.get('#result-content').hidden,false);
});

test('Local checking and translation keep working when storage is unavailable',async()=>{
  const app=webApp({storageBlocked:true});await app.input('#message','OTP அனுப்புங்கள்');await app.click('#analyze');
  assert.match(app.get('#verdict-title').textContent,/Likely scam/);
  await app.click('#save-local');assert.match(app.get('#toast').textContent,/could not save/);
  await app.change('#language','ta');assert.match(app.get('#verdict-title').textContent,/மோசடியாக/);
  assert.equal(app.get('#history-list').children.length,1);
});

test('Web history filters and exports summaries without message text or context answers',async()=>{
  const app=webApp();await app.input('#message','Unique private example: send OTP');await app.click('#analyze');
  await app.change('#context-request','secret');await app.click('#save-local');
  await app.change('#source','email');await app.input('#message','Hi, see you tomorrow for lunch.');await app.click('#analyze');await app.click('#save-local');
  await app.change('#history-verdict','scam');assert.equal(app.get('#history-list').children.length,1);
  assert.match(app.get('#history-count').textContent,/1 of 2/);
  await app.click('#export-history');
  const json=await app.blobs.get(app.downloads[0].href).text();const exported=JSON.parse(json);
  assert.equal(exported.results.length,2);assert.doesNotMatch(json,/Unique private|send OTP|tomorrow|context/);
  assert.ok(exported.results.every(row=>Object.keys(row).every(key=>['id','source','verdict','reason_codes','created_at','engine_version'].includes(key))));
});
