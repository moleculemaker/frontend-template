import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

import { derive, render, updateManagedLines, updateTitle, validate } from './app-sync.mjs';

const fixture = (name) => parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const generated = (app, file) => parse(render(app)[file]);

const EZSPEC = { id: 'ezspecificity', name: 'EZSpecificity', family: 'alphasynthesis', matomo_site_id: 1 };
const MUTAGENESIS = { id: 'mutagenesis', name: 'Mutagenesis', family: 'alphasynbio', matomo_site_id: 21 };

test('alphasynthesis chart values match ezspecificity-frontend as deployed', () => {
  assert.deepEqual(generated(EZSPEC, 'chart/values.staging.yaml'), fixture('ezspecificity.values.staging.yaml'));
  assert.deepEqual(generated(EZSPEC, 'chart/values.prod.yaml'), fixture('ezspecificity.values.prod.yaml'));
});

test('alphasynbio chart values match mutagenesis-frontend except the registry', () => {
  // Expected differences: mutagenesis pushes to private ghcr with a pull secret; the
  // template pushes to Docker Hub until #13 and needs no pull secret for public images.
  for (const env of ['staging', 'prod']) {
    const expected = fixture(`mutagenesis.values.${env}.yaml`);
    delete expected.imagePullSecrets;
    delete expected.imagePullSecret;
    delete expected.controller;
    const actual = generated(MUTAGENESIS, `chart/values.${env}.yaml`);
    assert.equal(actual.controller.image, `moleculemaker/mutagenesis-frontend:${env === 'prod' ? 'main' : 'staging'}`);
    delete actual.controller;
    assert.deepEqual(actual, expected, env);
  }
});

test('the identity module carries the family and the derived feedback address', () => {
  const ts = render(MUTAGENESIS)['src/app/app-identity.ts'];
  assert.match(ts, /family: "alphasynbio"/);
  assert.match(ts, /matomoSiteId: 21/);
  assert.match(ts, /feedbackEmail: "mutagenesis-feedback@ibiofoundry\.illinois\.edu"/);
});

test('managed lines take the derived value and keep their marker', () => {
  const text = [
    'env:',
    '  MAIN_REPO: moleculemaker/old-frontend # app:sync image',
    '  OTHER: untouched',
    '        - old.frontend.staging.example # app:sync staging_host',
  ].join('\n');

  const out = updateManagedLines(text, derive(EZSPEC), 'x.yml');

  assert.equal(out, [
    'env:',
    '  MAIN_REPO: moleculemaker/ezspecificity-frontend # app:sync image',
    '  OTHER: untouched',
    '        - ezspecificity.frontend.staging.mmli2.ncsa.illinois.edu # app:sync staging_host',
  ].join('\n'));
});

test('an unknown managed-line key is an error, not a silent skip', () => {
  assert.throws(() => updateManagedLines('  X: y # app:sync nope', derive(EZSPEC), 'x.yml'), /unknown app:sync key "nope"/);
});

test('validation rejects a bad slug, an unknown family and a missing site id', () => {
  assert.deepEqual(validate(EZSPEC), []);
  const errors = validate({ id: 'EZ Kinetics', name: 'x', family: 'other', matomo_site_id: null });
  assert.equal(errors.length, 3);
});

test('the page title is the app name, escaped', () => {
  assert.equal(updateTitle('<head><title>test</title></head>', 'A & <B>'), '<head><title>A &amp; &lt;B></title></head>');
  assert.throws(() => updateTitle('<head></head>', 'x'), /no <title>/);
});
