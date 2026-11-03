// frontend/src/config/version.ts
import versionData from '../../version.json';

export const APP_VERSION: string = versionData.version || '3.0';
export const APP_VERSION_LABEL: string = `v${APP_VERSION}`;
export const APP_BUILD_DATE: string = versionData.updatedAt || '';
