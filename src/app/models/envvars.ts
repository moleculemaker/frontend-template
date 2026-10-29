
export interface EnvVars {
  hostname: string;
  basePath: string;

  signInUrl: string;
  signOutUrl: string;

  userInfoUrl: string;
  frontendOnly: string;

  // 'local' | 'staging' | 'prod'. Anything but prod shows the internal-testing banner.
  environment: string;
  // The released tool, linked from that banner. Empty for local development.
  prodUrl: string;

  // 'proxied' sends Matomo hits through this app's nginx without cookies; anything else
  // (including empty) sends them straight to matomo.mmli2.ncsa.illinois.edu.
  matomoMode: string;
}
