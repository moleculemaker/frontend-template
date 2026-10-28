import { EnvironmentService } from '@services/environment.service';
import { importProvidersFrom, inject, provideAppInitializer } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { MatomoModule, MatomoRouterModule } from 'ngx-matomo-client';
import { MenuModule } from 'primeng/menu';
import { ApiModule, Configuration } from '@api/mmli-backend/v1';
import { provideApi as provideV1Api } from '@api/v1';
import { DialogModule } from 'primeng/dialog';
import { AppComponent } from './app/app.component';
import { provideStore } from '@ngrx/store';
import { providePrimeNG } from 'primeng/config';
import { AppRoutingModule } from './app/app-routing.module';
import { APP_IDENTITY } from './app/app-identity';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeng/themes/aura';

const initAppFn = (envService: EnvironmentService) => {
  return () => envService.loadEnvConfig("/assets/config/envvars.json");
};

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
      MatomoModule.forRoot({
        siteId: APP_IDENTITY.matomoSiteId,
        trackerUrl: 'https://matomo.mmli2.ncsa.illinois.edu/'
      }),
      MatomoRouterModule.forRoot(),
      MenuModule,
      ApiModule.forRoot(() => new Configuration()),
      ReactiveFormsModule,
      DialogModule,
      AppRoutingModule,
    ),
    // basePath is set from envvars.json by EnvironmentService
    provideV1Api({}),
    EnvironmentService,
    provideAppInitializer(() => {
      const initializerFn = (initAppFn)(inject(EnvironmentService));
      return initializerFn();
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
