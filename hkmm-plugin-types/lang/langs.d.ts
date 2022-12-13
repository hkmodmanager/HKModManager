export declare const I18nLanguages: Record<string, any>;
export declare let SupportedLanguages: Record<string, string>;
export declare let AllNamedLanaguages: Record<string, string>;
export interface ILanguageMetadata {
    alias?: string[];
    displayName: string;
    i18nName: string;
}
export declare function getLanguagesDir(): string;
export declare function searchLanguages(): void;
