import { EnvironmentService } from '@services/environment.service';
import { importProvidersFrom, inject, provideAppInitializer } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { MatomoInitializerService, MatomoModule, MatomoRouterModule, MatomoTracker } from 'ngx-matomo-client';
import { MenuModule } from 'primeng/menu';
import { ApiModule, Configuration } from '@api/mmli-backend/v1';
import { DialogModule } from 'primeng/dialog';
import { AppComponent } from './app/app.component';
import { provideStore } from '@ngrx/store';
import { providePrimeNG } from 'primeng/config';
import { AppRoutingModule } from './app/app-routing.module';
import { APP_IDENTITY } from './app/app-identity';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeng/themes/aura';

const MyPreset = definePreset(Aura, {
  semantic: {
    colorScheme: {
      light: {
        primary: {
          color: '#224063',
          hoverColor: '#315C8E',
          inverseColor: '#ffffff',
          activeColor: '#224063'
        }
      }
    }
  }
});


bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      // configured once envvars.json has loaded, below
      MatomoModule.forRoot({ mode: 'deferred' }),
      MatomoRouterModule.forRoot(),
      MenuModule,
      ApiModule.forRoot(() => new Configuration()),
      ReactiveFormsModule,
      DialogModule,
      AppRoutingModule,
    ),
    EnvironmentService,
    provideAppInitializer(async () => {
      const envService = inject(EnvironmentService);
      const matomo = inject(MatomoInitializerService);
      const tracker = inject(MatomoTracker);
      await envService.loadEnvConfig("/assets/config/envvars.json");

      if (envService.getEnvConfig().matomoMode === 'proxied') {
        // Through this app's own nginx (locations written by entrypoint.sh), which ad
        // blockers don't recognize, and without cookies, so no consent banner is needed.
        tracker.disableCookies();
        matomo.initializeTracker({
          siteId: APP_IDENTITY.matomoSiteId,
          trackerUrl: '/px/',
          trackerUrlSuffix: 'h',
          scriptUrl: '/px/s.js',
        });
      } else {
        matomo.initializeTracker({
          siteId: APP_IDENTITY.matomoSiteId,
          trackerUrl: 'https://matomo.mmli2.ncsa.illinois.edu/',
        });
      }
    }),
    provideHttpClient(withInterceptorsFromDi()),
    provideStore(),
    providePrimeNG({
      theme: {
        preset: MyPreset
      }
    })
  ]
})
  .catch(err => console.error(err));
