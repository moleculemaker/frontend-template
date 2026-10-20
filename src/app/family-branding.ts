import { APP_IDENTITY } from './app-identity';

/**
 * Header branding for each app family. The family comes from app.yaml (via the
 * generated app-identity.ts); everything else in the shell is shared.
 */
export const FAMILY_BRANDING = {
  alphasynthesis: {
    institute: 'Molecule Maker Lab Institute',
    platform: 'AlphaSynthesis',
    logo: { src: 'assets/branding/alphasynthesis-logo.svg', width: 30, height: 35 },
  },
  alphasynbio: {
    institute: 'NSF iBioFoundry Center',
    platform: 'AlphaSynBio',
    logo: { src: 'assets/branding/alphasynbio-logo.svg', width: 210, height: 70 },
  },
} as const;

export const BRANDING = FAMILY_BRANDING[APP_IDENTITY.family];
