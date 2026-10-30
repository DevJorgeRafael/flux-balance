export interface SettingsSectionVisibility {
  developerMode: boolean;
  data: boolean;
}

export function getSettingsSectionVisibility(
  nodeEnv: string | undefined
): SettingsSectionVisibility {
  return {
    developerMode: nodeEnv !== 'production',
    data: true,
  };
}

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const IS_DEVELOPMENT_MODE = getSettingsSectionVisibility(
  process.env.NODE_ENV
).developerMode;
