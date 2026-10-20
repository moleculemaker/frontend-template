
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
}
