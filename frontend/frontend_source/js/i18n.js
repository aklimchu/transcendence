import { TranslationManager } from "./utils.js";
import { authFetch } from "./auth.js";

const translationManager = new TranslationManager();

async function initTranslations() {
    let language = "eng";
    try {
        const response = await authFetch("/pong_api/pong_settings/", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        if (response.ok) {
            const data = await response.json();
            if (data.ok && data.settings && data.settings.language) {
                language = data.settings.language;
            }
        }
    } catch (error) {
        console.error("Failed to fetch settings for language:", error);
    }

    const translations = await translationManager.initLanguage(language, [
        "nav.title",
        "nav.lobby",
        "nav.game",
        "nav.tournament",
        "nav.settings",
        "nav.stats",
        "nav.logout",
        "nav.error"
    ]);

    const titleElement = document.querySelector("title[data-i18n='nav.title']");
    if (titleElement && translations.nav?.title) {
        titleElement.textContent = translations.nav.title;
        console.log(`Updated title to: ${translations.nav.title}`);
    }
}

document.addEventListener("DOMContentLoaded", initTranslations);