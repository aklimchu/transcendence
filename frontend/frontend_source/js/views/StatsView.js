import AbstractView from "./AbstractView.js";
import { authFetch } from "../auth.js";
import { TranslationManager, extractErrorMessage } from "../utils.js"

export default class extends AbstractView
{
	constructor(params)
	{
    	super(params);
		this.translationManager = new TranslationManager(); // Initialize TranslationManager
        this.matchHistories = { p1: [], p2: [], p3: [], p4: [] }; // Initialize matchHistories
	}

    async goToView()
    {
        let json;
        try {
            json = await this.fetchSessionData();
            if (!json || !json.data) {
                await this.goToNoAuth();
                return;
            }
        } catch (err) {
            await this.goToNoAuth("Session expired. Please log in again.");
            return;
        }

		console.log(json)

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
			throw new Error(extractErrorMessage(responseText, response.status));
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
			settingsData = { theme: "light", font_size: "medium",  language: "eng"}; // Default to light if no settings
			throw new Error("Invalid settings data received");
		}
		} catch (error) {
			console.error("Failed to load settings:", error);
			alert("Error loading settings: " + error.message);
    	    settingsData = { theme: "light", font_size: "medium",  language: "eng" }; // Fallback theme
		}

		const players = json.data["players"];
        if (!players || !players["p1"]) {
            console.error("Player stats not found in response:", json);
            this.goToError();
            return;
        }

        // Fetch Match History for each player
        try {
            const playerIds = [
                { key: "p1", id: players.p1.id },
                { key: "p2", id: players.p2.id },
                { key: "p3", id: players.p3.id },
                { key: "p4", id: players.p4.id }
            ];

            const fetchPromises = playerIds.map(async ({ key, id }) => {
                try {
                    const response = await authFetch(`/pong_api/player_match_history/${id}/`, {
                        method: "GET",
                        headers: { "Content-Type": "application/json" }
                    });
                    const data = await response.json();
                    if (data.ok) {
                        this.matchHistories[key] = data.data || [];
                    } else {
                        console.error(`Failed to fetch match history for ${key} (ID: ${id}):`, data.error);
                        this.matchHistories[key] = [];
                    }
                } catch (error) {
                    console.error(`Error fetching match history for ${key} (ID: ${id}):`, error);
                    this.matchHistories[key] = [];
                }
            });

            await Promise.all(fetchPromises);
            console.log("Match Histories:", this.matchHistories);
        } catch (error) {
            console.error("Failed to fetch match histories:", error);
            // Continue rendering the page even if match history fails
        }

        const content = `
        <div class="stats-container my-2">
            <div class="stats-card text-center">
                <h3 class="stats-title mb-3" data-i18n="stats.title">🏓Player Performance Overview🐍</h3>
                <div class="row row-cols-1 row-cols-md-2 g-4">
                    <div class="col"><canvas id="chartP1"></canvas></div>
                    <div class="col"><canvas id="chartP2"></canvas></div>
                    <div class="col"><canvas id="chartP3"></canvas></div>
                    <div class="col"><canvas id="chartP4"></canvas></div>
                </div>
            </div>
        </div>
        `;
        this.unhideNavbar();
        await this.setContent(content);

		// Apply translations
		const translations = await this.translationManager.initLanguage(settingsData.language, ['stats.title', 'lobby.victories', 'lobby.defeats']);
		
		// Set translated page title
		const title = translations.stats?.page_title || 'Stats';
		this.setTitle(title);

        // Update createChart to use translations
		function createChart(id, player, translations) {
		    const ctx = document.getElementById(id).getContext('2d');
		    const theme = document.body.getAttribute('data-theme') || 'light';
		    const font_size = settingsData.font_size || 'medium';
		
		    // Color mappings for theme
		    const victoryColor = theme === 'dark' ? '#2ecc71' : '#157045';
		    const defeatColor = theme === 'dark' ? '#e74c3c' : '#931024';
		    const titleColor = theme === 'dark' ? '#00cc99' : '#005252';
		    const legendColor = theme === 'dark' ? '#b0b0b0' : '#005252';
		
		    // Font size mappings
		    const fontSizes = {
		        small: { title: 13, legend: 12 },
		        medium: { title: 17, legend: 15 },
		        large: { title: 21, legend: 18 }
		    };
		    const selectedFontSize = fontSizes[font_size] || fontSizes['medium'];
		
		    new Chart(ctx, {
		        type: 'pie',
		        data: {
		            labels: [
		                translations.lobby?.victories || translations['lobby.victories'] || 'Victories',
		                translations.lobby?.defeats || translations['lobby.defeats'] || 'Defeats'
		            ],
		            datasets: [{
		                data: [player.won, player.lost],
		                backgroundColor: [victoryColor, defeatColor],
		                borderColor: '#fff',
		                borderWidth: 2
		            }]
		        },
		        options: {
		            responsive: true,
		            plugins: {
		                title: {
		                    display: true,
		                    text: `${player.name}`,
		                    font: { size: selectedFontSize.title },
		                    color: titleColor
		                },
		                legend: {
		                    position: 'bottom',
		                    labels: {
		                        font: { size: selectedFontSize.legend },
		                        color: legendColor
		                    }
		                }
		            }
		        }
		    });
		}

		createChart("chartP1", players["p1"], translations);
		createChart("chartP2", players["p2"], translations);
		createChart("chartP3", players["p3"], translations);
		createChart("chartP4", players["p4"], translations);
	}
}