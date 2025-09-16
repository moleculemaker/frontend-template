import { EnvironmentService } from '@services/environment.service';
import { importProvidersFrom, inject, provideAppInitializer } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { MatomoModule, MatomoRouterModule } from 'ngx-matomo-client';
import { MenuModule } from 'primeng/menu';
import { ApiModule, Configuration } from '@api/mmli-backend/v1';
import { DialogModule } from 'primeng/dialog';
import { AppComponent } from './app/app.component';
import { provideStore } from '@ngrx/store';
import { providePrimeNG } from 'primeng/config';
import { AppRoutingModule } from './app/app-routing.module';
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
        siteId: 8, //TODO: update site id
        trackerUrl: 'https://matomo.mmli1.ncsa.illinois.edu/'
      }),
      MatomoRouterModule,
      MenuModule,
      ApiModule.forRoot(() => new Configuration()),
      ReactiveFormsModule,
      DialogModule,
      AppRoutingModule,
    ),
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
