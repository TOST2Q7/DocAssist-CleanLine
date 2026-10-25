export const APP_VERSION: string = __APP_VERSION__;

export const SOURCE_URL = 'https://github.com/TOST2Q7/DocAssist-CleanLine';

/** Single-file build (opened from file://): no OAuth, so Google features must be off. */
export const IS_FILE_BUILD = import.meta.env.MODE === 'file';
