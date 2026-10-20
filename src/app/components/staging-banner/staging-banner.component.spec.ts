import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';

import { EnvironmentService } from '~/app/services/environment.service';
import { StagingBannerComponent } from './staging-banner.component';

function render(config: { environment?: string; prodUrl?: string } | undefined) {
  TestBed.configureTestingModule({
    imports: [StagingBannerComponent],
    providers: [{ provide: EnvironmentService, useValue: { getEnvConfig: () => config } }],
  });
  const fixture = TestBed.createComponent(StagingBannerComponent);
  fixture.detectChanges();
  return { el: fixture.nativeElement as HTMLElement, meta: TestBed.inject(Meta) };
}

describe('StagingBannerComponent', () => {
  afterEach(() => document.querySelector('meta[name="robots"]')?.remove());

  it('on staging, says so, links the released tool and asks not to be indexed', () => {
    const { el, meta } = render({ environment: 'staging', prodUrl: 'https://x.platform.moleculemaker.org' });

    expect(el.textContent).toContain('internal testing build');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('https://x.platform.moleculemaker.org');
    expect(meta.getTag('name="robots"')?.content).toBe('noindex');
  });

  it('locally, shows the banner without a link when there is no prod URL', () => {
    const { el } = render({ environment: 'local', prodUrl: '' });

    expect(el.textContent).toContain('internal testing build');
    expect(el.querySelector('a')).toBeNull();
  });

  it('on prod, shows nothing and adds no robots tag', () => {
    const { el, meta } = render({ environment: 'prod', prodUrl: 'https://x.platform.moleculemaker.org' });

    expect(el.textContent?.trim()).toBe('');
    expect(meta.getTag('name="robots"')).toBeNull();
  });

  it('with no environment configured, shows nothing', () => {
    expect(render({}).el.textContent?.trim()).toBe('');
  });

  it('before any config has loaded, shows nothing', () => {
    expect(render(undefined).el.textContent?.trim()).toBe('');
  });
});
