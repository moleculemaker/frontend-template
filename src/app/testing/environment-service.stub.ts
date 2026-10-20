import { EnvironmentService } from '~/app/services/environment.service';
import { EnvVars } from '~/app/models/envvars';

/**
 * EnvironmentService is provided only in main.ts, which TestBed never loads, so
 * any spec whose component reaches TestService needs this. frontendOnly 'true'
 * makes the services serve fixtures instead of HTTP.
 */
const envConfig: EnvVars = {
  hostname: 'http://environment-service.stub',
  basePath: '/api',
  signInUrl: 'http://environment-service.stub/signin',
  signOutUrl: 'http://environment-service.stub/signout',
  userInfoUrl: 'http://environment-service.stub/userinfo',
  frontendOnly: 'true',
  environment: 'prod', // no staging banner in other components' specs
  prodUrl: 'http://environment-service.stub',
};

export function provideEnvironmentServiceStub() {
  return { provide: EnvironmentService, useValue: { getEnvConfig: () => envConfig } as Pick<EnvironmentService, 'getEnvConfig'> };
}
