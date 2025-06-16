import AbstractView from "./AbstractView.js";
import { authFetch } from "../auth.js";

export default class extends AbstractView {
    constructor(params) {
        super(params);
    }

    async goToView() {
        let json;
        try {
            json = await this.fetchSessionData();
            if (!json || !json.data) {
                await this.goToNoAuth("Session expired. Please log in again.");
                return;
            }
        } catch (err) {
            await this.goToNoAuth("Session expired. Please log in again.");
            return;
        }

        // Fetch user settings to get the theme
        let settingsData;
        try {
            console.log("Fetching settings from /pong_api/pong_settings/");
			const response = await authFetch("/pong_api/pong_settings/", {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            console.log("Response status:", response.status);
            const responseText = await response.text();
            console.log("Response text:", responseText);
		if (!response.ok) {
			throw new Error(this.extractErrorMessage(responseText, response.status));
		}
		const data = JSON.parse(responseText);
		console.log("Settings data:", data);
		if (data.ok && data.settings && typeof data.settings === "object") {
			settingsData = {
				...data.settings,
				players: Array(4).fill().map((_, index) => {
					const player = data.settings.players?.find(p => p.position === index + 1);
					return { player_name: player?.player_name || '', position: index + 1 };
				})
			};
		} else {
			console.warn("Invalid settings response:", data);
			settingsData = { theme: "light" }; // Default to light if no settings
			throw new Error("Invalid settings data received");
		}
	} catch (error) {
		console.error("Failed to load settings:", error);
		alert("Error loading settings: " + error.message);
        settingsData = { theme: "light" }; // Fallback theme
	}

        // Apply the theme to the body
        this.applyTheme(settingsData.theme);

        var content = `
        <div class="container my-4">
            <div class="row row-cols-1 row-cols-md-2 g-4">
                <div class="col">
                    <div class="lobby-card1 h-100 text-center">
                        <div class="lobby-card-body">
                            <h4 class="lobby-card-title mt-1">${json.data["players"]["p1"]["name"]}</h4>
                            <p class="lobby-card-text text-success mt-4"><span class="fw-bold victory-text">Victories: ${json.data["players"]["p1"]["won"]}</span></p>
                            <p class="lobby-card-text text-danger"><span class="fw-bold defeat-text">Defeats: ${json.data["players"]["p1"]["lost"]}</span></p>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="lobby-card2 h-100 text-center">
                        <div class="lobby-card-body">
                            <h4 class="lobby-card-title mt-1">${json.data["players"]["p2"]["name"]}</h4>
                            <p class="lobby-card-text text-success mt-4"><span class="fw-bold victory-text">Victories: ${json.data["players"]["p2"]["won"]}</span></p>
                            <p class="lobby-card-text text-danger"><span class="fw-bold defeat-text">Defeats: ${json.data["players"]["p2"]["lost"]}</span></p>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="lobby-card3 h-100 text-center">
                        <div class="lobby-card-body">
                            <h4 class="lobby-card-title mt-1">${json.data["players"]["p3"]["name"]}</h4>
                            <p class="lobby-card-text text-success mt-4"><span class="fw-bold victory-text">Victories: ${json.data["players"]["p3"]["won"]}</span></p>
                            <p class="lobby-card-text text-danger"><span class="fw-bold defeat-text">Defeats: ${json.data["players"]["p3"]["lost"]}</span></p>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="lobby-card4 h-100 text-center">
                        <div class="lobby-card-body">
                            <h4 class="lobby-card-title mt-1">${json.data["players"]["p4"]["name"]}</h4>
                            <p class="lobby-card-text text-success mt-4"><span class="fw-bold victory-text">Victories: ${json.data["players"]["p4"]["won"]}</span></p>
                            <p class="lobby-card-text text-danger"><span class="fw-bold defeat-text">Defeats: ${json.data["players"]["p4"]["lost"]}</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        this.setTitle("Lobby");
        this.unhideNavbar();
        await this.setContent(content);
    }

    // Assume this method exists in AbstractView.js
    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
    }
}