import { authFetch } from './auth.js';

const languageCache = {}; // Cache translations to avoid repeated fetches

export class TranslationManager {
    constructor(fallbackLanguage = 'eng') {
        this.fallbackLanguage = fallbackLanguage;
        this.currentLanguage = fallbackLanguage;
        this.translations = {};
        this.languageMap = { en: 'eng', sw: 'swd', swe: 'swd', fi: 'fin' }; // Normalize language codes
    }

    // Load translations for a given language
    async loadLanguage(lang) {
        const normalizedLang = this.languageMap[lang] || lang || this.fallbackLanguage;
        console.log(`Loading language file: ../lang/${normalizedLang}.json`);

        // Check cache first
        if (languageCache[normalizedLang]) {
            console.log(`Using cached translations for ${normalizedLang}`);
            return languageCache[normalizedLang];
        }

        try {
            const res = await fetch(`../lang/${normalizedLang}.json?ts=${Date.now()}`); // Cache-busting
            if (!res.ok) {
                throw new Error(`Failed to load language file: ${normalizedLang}.json (Status: ${res.status})`);
            }
            const translations = await res.json();
            if (!translations || typeof translations !== 'object') {
                throw new Error(`Invalid translations in ${normalizedLang}.json: Empty or not an object`);
            }
            console.log(`Loaded translations for ${normalizedLang}:`, JSON.stringify(translations, null, 2));
            languageCache[normalizedLang] = translations;
            return translations;
        } catch (err) {
            console.error(`Error loading language file ${normalizedLang}.json:`, err);
            throw err;
        }
    }

    // Get translation for a key (supports nested keys like stats.title)
    getTranslation(key, translations) {
        if (!key || !translations) return null;
        if (key.includes('.')) {
            const [namespace, subkey] = key.split('.');
            return translations[namespace]?.[subkey] || null;
        }
        return translations[key] || null;
    }

    // Apply translations to all [data-i18n] elements
    applyTranslations(translations) {
        const elements = document.querySelectorAll("[data-i18n]");
        console.log(`Found ${elements.length} elements with data-i18n`);
        elements.forEach(element => {
            const key = element.getAttribute("data-i18n");
            console.log(`Processing element with key: ${key}`);
            const value = this.getTranslation(key, translations);
            if (value) {
                element.textContent = value;
                console.log(`Updated element with key ${key} to: ${value}`);
            } else {
                console.warn(`Translation key ${key} not found`);
            }
        });
    }

    // Initialize language for the app
    async initLanguage(lang, requiredKeys = ['stats.title']) {
        const normalizedLang = this.languageMap[lang] || lang || this.fallbackLanguage;
        console.log(`Initializing language: ${normalizedLang}`);
        
        try {
            this.translations = await this.loadLanguage(normalizedLang);
            // Check for required keys
            const missingKeys = requiredKeys.filter(key => !this.getTranslation(key, this.translations));
            if (missingKeys.length > 0 && normalizedLang !== this.fallbackLanguage) {
                console.warn(`Missing required keys in ${normalizedLang}: ${missingKeys.join(', ')}`);
                throw new Error(`Missing required keys in ${normalizedLang}`);
            }
            this.currentLanguage = normalizedLang;
        } catch (err) {
            console.warn(`Failed to load or process language "${normalizedLang}":`, err);
            if (normalizedLang !== this.fallbackLanguage) {
                try {
                    console.log(`Attempting to load fallback language: ${this.fallbackLanguage}`);
                    this.translations = await this.loadLanguage(this.fallbackLanguage);
                    const missingFallbackKeys = requiredKeys.filter(key => !this.getTranslation(key, this.translations));
                    if (missingFallbackKeys.length > 0) {
                        throw new Error(`Missing required keys in ${this.fallbackLanguage}: ${missingFallbackKeys.join(', ')}`);
                    }
                    this.currentLanguage = this.fallbackLanguage;
                } catch (fallbackErr) {
                    console.error(`Failed to load fallback language "${this.fallbackLanguage}":`, fallbackErr);
                    alert("Failed to load translations. Using default text.");
                    this.translations = {};
                }
            } else {
                console.error(`Primary language was fallback "${this.fallbackLanguage}" and it failed`);
                alert("Failed to load translations. Using default text.");
                this.translations = {};
            }
        }
        this.applyTranslations(this.translations);
        return this.translations;
    }

    // Get current translations for use in views (e.g., charts)
    getCurrentTranslations() {
        return this.translations;
    }
}

export async function resetSettingsToDefault()
    {
        try {
            // Fetch current settings
            console.log("Fetching current settings from /pong_api/pong_settings/");
            const getResponse = await authFetch("/pong_api/pong_settings/", {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            console.log("GET Response status:", getResponse.status);
            const getResponseText = await getResponse.text();
            console.log("GET Response text:", getResponseText);
            if (!getResponse.ok) {
                throw new Error(this.extractErrorMessage(getResponseText, getResponse.status));
            }
            const getData = JSON.parse(getResponseText);
            console.log("Current settings data:", getData);
            if (!getData.ok || !getData.settings || typeof getData.settings !== "object") {
                throw new Error("Invalid settings data received");
            }

            // Update only the specified settings
            const updatedSettings = {
                ...getData.settings,
                game_speed: "normal",
                paddle_size: "normal",
                ball_size: "medium",
                power_jump: "on"
            };

            // Send updated settings to the server
            console.log("Sending updated settings to /pong_api/pong_settings/");
            const postResponse = await authFetch("/pong_api/pong_settings/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedSettings)
            });
            console.log("POST Response status:", postResponse.status);
            const postResponseText = await postResponse.text();
            console.log("POST Response text:", postResponseText);
            if (!postResponse.ok) {
                throw new Error(this.extractErrorMessage(postResponseText, postResponse.status));
            }
            const postData = JSON.parse(postResponseText);
            console.log("Settings update response:", postData);
            if (postData.ok) {
                if (updatedSettings.language == "eng")
					alert("Settings have been reset to default!");
				else if (updatedSettings.language == "fin")
					alert("Asetukset on palautettu oletusasetuksiin!");
				else
					alert("Inställningarna har återställts till standar dinställningarna!");
            } else {
                throw new Error("Failed to reset settings");
            }
        } catch (error) {
            console.error("Failed to reset settings:", error);
            alert("Error resetting settings: " + error.message);
        }
    }