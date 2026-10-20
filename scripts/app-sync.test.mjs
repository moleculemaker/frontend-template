import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

import { FAMILIES, derive, managedFiles, render, updateIndexHtml, updateManagedLines, validate } from './app-sync.mjs';

const fixture = (name) => parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const generated = (app, file) => parse(render(app)[file]);
// The live apps predate the staging banner's config keys
const withoutBannerConfig = (values) => {
  delete values.config.environment;
  delete values.config.prodUrl;
  return values;
};

const EZSPEC = { id: 'ezspecificity', name: 'EZSpecificity', family: 'alphasynthesis', matomo_site_id: 1, launched: true };
const MUTAGENESIS = { id: 'mutagenesis', name: 'Mutagenesis', family: 'alphasynbio', matomo_site_id: 21, launched: true };

test('alphasynthesis chart values match ezspecificity-frontend as deployed', () => {
  assert.deepEqual(withoutBannerConfig(generated(EZSPEC, 'chart/values.staging.yaml')), fixture('ezspecificity.values.staging.yaml'));
  assert.deepEqual(withoutBannerConfig(generated(EZSPEC, 'chart/values.prod.yaml')), fixture('ezspecificity.values.prod.yaml'));
});

test('alphasynbio chart values match mutagenesis-frontend except the registry', () => {
  // Expected differences: mutagenesis pushes to private ghcr with a pull secret; the
  // template pushes to Docker Hub until #13 and needs no pull secret for public images.
  for (const env of ['staging', 'prod']) {
    const expected = fixture(`mutagenesis.values.${env}.yaml`);
    delete expected.imagePullSecrets;
    delete expected.imagePullSecret;
    delete expected.controller;
    const actual = withoutBannerConfig(generated(MUTAGENESIS, `chart/values.${env}.yaml`));
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
  const errors = validate({ id: 'EZ Kinetics', name: 'x', family: 'other', matomo_site_id: null, launched: false });
  assert.equal(errors.length, 3);
});

const LAUNCHED = { name: 'x', launched: true };

test('the page title is the app name, escaped', () => {
  assert.equal(updateIndexHtml('<head><title>test</title></head>', { name: 'A & <B>', launched: true }),
    '<head><title>A &amp; &lt;B></title></head>');
  assert.throws(() => updateIndexHtml('<head></head>', LAUNCHED), /no <title>/);
});

test('a tagged line the rewriter cannot parse is an error, not a silent skip', () => {
  const d = derive(EZSPEC);
  // value inside a block scalar: the tag would be part of the value
  assert.throws(() => updateManagedLines('images: |\n  moleculemaker/old # app:sync image', d, 'x.yml'), /cannot rewrite/);
  // hyphenated tag key
  assert.throws(() => updateManagedLines('  X: y # app:sync staging-host', d, 'x.yml'), /cannot rewrite/);
  // CRLF line ending
  assert.throws(() => updateManagedLines('  X: y # app:sync image\r', d, 'x.yml'), /cannot rewrite/);
  // tag spacing the strict pattern does not accept
  assert.throws(() => updateManagedLines('  X: y #app:sync image', d, 'x.yml'), /cannot rewrite/);
  assert.throws(() => updateManagedLines('  X: y #  app:sync image', d, 'x.yml'), /cannot rewrite/);
});

test('a "- key: value" list item keeps its key', () => {
  const out = updateManagedLines('  - image: moleculemaker/old # app:sync image', derive(EZSPEC), 'x.yml');
  assert.equal(out, '  - image: moleculemaker/ezspecificity-frontend # app:sync image');
});

test('replacement patterns in the name are inserted literally', () => {
  const html = '<head><title>old</title></head>';
  const app = { name: "A $& B $` C $' D", launched: true };
  const once = updateIndexHtml(html, app);
  assert.equal(once, "<head><title>A $&amp; B $` C $' D</title></head>");
  assert.equal(updateIndexHtml(once, app), once, 'stable on re-sync');
});

test('the id must leave room for derived resource names within a 63-character label', () => {
  assert.deepEqual(validate({ ...EZSPEC, id: 'a'.repeat(40) }), []);
  assert.equal(validate({ ...EZSPEC, id: 'a'.repeat(41) }).length, 1);
});

test('every family has header branding, and every branded family is deployable', () => {
  const ts = readFileSync(new URL('../src/app/family-branding.ts', import.meta.url), 'utf8');
  const branded = [...ts.matchAll(/^  (\w+): \{$/gm)].map((m) => m[1]).sort();
  assert.deepEqual(branded, Object.keys(FAMILIES).sort());
});

test('managed files are every tracked file with a tag, outside scripts/ and docs', () => {
  const files = managedFiles();
  assert.ok(files.includes('.github/workflows/docker.yml'));
  assert.ok(files.includes('.github/workflows/cron.yml'));
  assert.ok(!files.some((f) => f.startsWith('scripts/') || f.endsWith('.md')));
});

test('no tagged files is an empty list, not an error; other git failures still throw', () => {
  const noMatch = () => { throw Object.assign(new Error('Command failed'), { status: 1 }); };
  assert.deepEqual(managedFiles(noMatch), []);
  const notARepo = () => { throw Object.assign(new Error('not a git repository'), { status: 128 }); };
  assert.throws(() => managedFiles(notARepo), /not a git repository/);
});

test('staging and local config turn the banner on and link prod; prod config turns it off', () => {
  assert.deepEqual(
    [generated(EZSPEC, 'chart/values.yaml').config, generated(EZSPEC, 'chart/values.staging.yaml').config,
      generated(EZSPEC, 'chart/values.prod.yaml').config].map((c) => [c.environment, c.prodUrl]),
    [['local', 'https://ezspecificity.platform.moleculemaker.org'],
      ['staging', 'https://ezspecificity.platform.moleculemaker.org'],
      ['prod', 'https://ezspecificity.platform.moleculemaker.org']]);
});

test('noindex is in the page until the app is launched, once, and stable on re-sync', () => {
  const html = '<head>\n        <title>t</title>\n        <base href="/" />\n</head>';
  const unlaunched = updateIndexHtml(html, { name: 't', launched: false });
  assert.equal(unlaunched.match(/name="robots" content="noindex"/g).length, 1);
  assert.equal(updateIndexHtml(unlaunched, { name: 't', launched: false }), unlaunched);
  assert.equal(updateIndexHtml(unlaunched, { name: 't', launched: true }), html);
});

test('launched must be true or false', () => {
  assert.equal(validate({ ...EZSPEC, launched: 'yes' }).length, 1);
});

test('a robots meta tag that app:sync did not write is an error, launched or not', () => {
  const variants = [
    '<meta name="robots" content="noindex">',
    '<meta name="robots" content="noindex, nofollow" />',
    '<meta content="noindex" name="robots" />',
  ];
  for (const tag of variants) {
    const html = `<head>\n    <title>t</title>\n    ${tag}\n</head>`;
    for (const launched of [true, false]) {
      assert.throws(() => updateIndexHtml(html, { name: 't', launched }), /robots/, `${tag} launched=${launched}`);
    }
  }
});
