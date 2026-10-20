import { createServer, IncomingMessage, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { NightwatchTests } from 'nightwatch';

/**
 * Submit -> queued -> processing -> results, against a mock of mmli-backend's /v1 API.
 *
 * The app reads the API's address from /assets/config/envvars.json at startup; the
 * test answers that request (over CDP, so Chrome only) with one pointing at the mock.
 * The mock reports the job queued, then processing, then completed, one status per
 * poll. The app polls every 10s, so this test takes about half a minute.
 */
const TESTING_URL = process.env['TESTING_URL'] || 'http://localhost:4200';
const JOB_ID = 'e2e-job';
const STATUSES = ['queued', 'processing', 'completed'];
const RESULTS = {
  rows: [{ id: 'insulin-b', length: 30, molecular_weight_da: 3429.96 }],
  artifacts: [{ name: 'results.csv', media_type: 'text/csv', description: 'All rows as CSV' }],
};

let server: Server;
let api = '';
let polls = 0;
let submitted: { tool: string; body: string; contentType: string; email?: string } | undefined;

const job = (status: string) => ({
  job_id: JOB_ID, tool: 'job-template-sample', status, parent_job_id: null,
  submitted_at: new Date().toISOString(), started_at: null, finished_at: null,
  inputs: { sequences: [{ id: 'insulin-b', sequence: 'FVNQHLCGSHLVEALYLVCGERGFFYTPKT' }] },
});

function read(request: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    request.on('data', (chunk) => (body += chunk));
    request.on('end', () => resolve(body));
  });
}

/** Waits in the test process, where the mock API records what it received. */
async function until(condition: () => boolean, timeoutMs: number): Promise<void> {
  for (let waited = 0; !condition() && waited < timeoutMs; waited += 100) {
    await browser.pause(100);
  }
}

function startMockApi(): Promise<void> {
  server = createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Notify-Email');
    if (request.method === 'OPTIONS') return response.writeHead(204).end();

    const send = (status: number, body: unknown) =>
      response.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
    const url = request.url ?? '';
    const submit = url.match(/^\/v1\/tools\/([^/]+)\/jobs$/);

    if (request.method === 'POST' && submit) {
      submitted = {
        tool: submit[1],
        body: await read(request),
        contentType: request.headers['content-type'] ?? '',
        email: request.headers['x-notify-email'] as string | undefined,
      };
      return send(201, job('queued'));
    }
    if (url === `/v1/jobs/${JOB_ID}`) return send(200, job(STATUSES[Math.min(polls++, STATUSES.length - 1)]));
    if (url === `/v1/jobs/${JOB_ID}/results`) return send(200, { job_id: JOB_ID, tool: 'job-template-sample', results: RESULTS });
    send(404, { type: 'about:blank', title: 'Not found', status: 404 });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    api = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    resolve();
  }));
}

const jobFlow: NightwatchTests = {
  before: async () => {
    await startMockApi();
    await browser.network.mockResponse(`${TESTING_URL}/assets/config/envvars.json`, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostname: api, basePath: '', signInUrl: '', signOutUrl: '', userInfoUrl: `${api}/userinfo`,
        frontendOnly: 'false', environment: 'prod', prodUrl: '',
      }),
    });
  },

  after: () => {
    server?.close();
  },

  'submits the form as multipart with the email in a header': async () => {
    await browser.url(`${TESTING_URL}/test`);
    await browser.waitForElementVisible('[data-testid="sequences"]');
    await browser.setValue('[data-testid="sequences"]', '>insulin-b\nFVNQHLCGSHLVEALYLVCGERGFFYTPKT');
    await browser.setValue('#subscriber-email', 'e2e@example.org');
    await browser.click('[data-testid="submit"] button');

    await until(() => submitted !== undefined, 5000);
    browser.assert.ok(submitted !== undefined, 'the job was submitted');
    browser.assert.equal(submitted!.tool, 'job-template-sample');
    browser.assert.ok(submitted!.contentType.startsWith('multipart/form-data'), 'sent as multipart');
    browser.assert.ok(submitted!.body.includes('"sequence":"FVNQHLCGSHLVEALYLVCGERGFFYTPKT"'), 'inputs part holds the document');
    browser.assert.equal(submitted!.email, 'e2e@example.org');
  },

  'lands on /result/:id and shows queued, then processing': async () => {
    await browser.assert.urlContains(`/result/${JOB_ID}`);
    await browser.waitForElementVisible('[data-testid="job-queued"]', 5000);
    await browser.waitForElementVisible('[data-testid="job-processing"]', 15000);
  },

  'shows the results once the job completes': async () => {
    await browser.waitForElementVisible('[data-testid="results-table"]', 15000);
    browser.assert.textContains('[data-testid="results-table"]', 'insulin-b');
    browser.assert.textContains('[data-testid="results-table"]', '3429.96');
  },
};

export default jobFlow;
