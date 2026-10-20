import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { provideApi } from '@api/v1';
import { EnvironmentService } from './environment.service';
import { TestService } from './test.service';

const API = 'https://backend.test/v1';
const INPUTS = { sequences: [{ id: 'a', sequence: 'ACD' }] };

describe('TestService', () => {
  let service: TestService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApi({ basePath: API }),
        { provide: EnvironmentService, useValue: { getEnvConfig: () => ({ frontendOnly: 'false' }) } },
      ],
    });
    service = TestBed.inject(TestService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('submit', () => {
    it('posts multipart to the app\'s tool: the inputs as JSON text, then each file', () => {
      const file = new File(['>a\nACD'], 'extra.fasta');
      service.submit(INPUTS, [file], '').subscribe();

      const request = http.expectOne(`${API}/tools/${service.tool}/jobs`);
      expect(request.request.method).toBe('POST');
      const body = request.request.body as FormData;
      expect(JSON.parse(body.get('inputs') as string)).toEqual(INPUTS);
      expect((body.getAll('files') as File[]).map((f) => f.name)).toEqual(['extra.fasta']);
      // Left unset, so the browser writes the multipart boundary into it
      expect(request.request.headers.has('Content-Type')).toBeFalse();
      request.flush({ job_id: 'j1', status: 'queued' });
    });

    it('sends the notification address as a header, so the body stays the input document', () => {
      service.submit(INPUTS, [], 'a@b.c').subscribe();

      const request = http.expectOne(`${API}/tools/${service.tool}/jobs`);
      expect(request.request.headers.get('X-Notify-Email')).toBe('a@b.c');
      expect((request.request.body as FormData).has('email')).toBeFalse();
      request.flush({ job_id: 'j1', status: 'queued' });
    });

    it('sends no header without an address', () => {
      service.submit(INPUTS).subscribe();

      const request = http.expectOne(`${API}/tools/${service.tool}/jobs`);
      expect(request.request.headers.has('X-Notify-Email')).toBeFalse();
      request.flush({ job_id: 'j1', status: 'queued' });
    });
  });

  it('reads the job from /v1/jobs/:id', () => {
    let status = '';
    service.getJob('j1').subscribe((job) => (status = job.status));

    http.expectOne(`${API}/jobs/j1`).flush({ job_id: 'j1', status: 'processing' });
    expect(status).toBe('processing');
  });

  it('unwraps the results envelope', () => {
    let results: unknown;
    service.getResults('j1').subscribe((r) => (results = r));

    http.expectOne(`${API}/jobs/j1/results`).flush({ job_id: 'j1', tool: 't', results: { rows: [], artifacts: [] } });
    expect(results).toEqual({ rows: [], artifacts: [] });
  });

  it('links artifacts under the job', () => {
    expect(service.artifactUrl('j1', 'results.csv')).toBe(`${API}/jobs/j1/artifacts/results.csv`);
  });
});
