import AbstractView from "./AbstractView.js";
import { authFetch } from "../auth.js";

export default class extends AbstractView
{
	constructor(params)
	{
    	super(params);
	}

// 	async fetchStatsData()
// 	{
// 		try
// 		{
// 			const response = await authFetch("pong_api/pong_stats_data/", {method: "GET"});
			
// 			if (!response) {
// 				this.goToNoAuth("Session expired. Please log in again.");
// 				return;
// 			}
// 			if (!response.ok) {
// 				this.goToError();
// 				return;
// 			}
// 			return await response.json();
// 		}
// 		catch(err)
// 		{
// //			console.error(err.message);
// 			if (err.message === "No response from server")
// 				this.goToNoAuth("Session expired. Please log in again.");
// 			else
// 				this.goToError();
// 			throw err;
// 		}
// 	}

    async goToView()
    {
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

		console.log(json)
		
/* 		// Fetch user settings to get the theme
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
		this.applyTheme(settingsData.theme); */

		const players = json.data["players"];
        if (!players || !players["p1"]) {
            console.error("Player stats not found in response:", json);
            this.goToError();
            return;
        }
        const content = `
        <div class="stats-container my-2">
            <div class="stats-card text-center">
                <h3 class="stats-title mb-3">🏓Player Performance Overview🐍</h3>
                <div class="row row-cols-1 row-cols-md-2 g-4">
                    <div class="col"><canvas id="chartP1"></canvas></div>
                    <div class="col"><canvas id="chartP2"></canvas></div>
                    <div class="col"><canvas id="chartP3"></canvas></div>
                    <div class="col"><canvas id="chartP4"></canvas></div>
                </div>
            </div>
        </div>
        `;
        this.setTitle("Statistics");
        this.unhideNavbar();
        await this.setContent(content);

        function createChart(id, player) {
            const ctx = document.getElementById(id).getContext('2d');
            const theme = document.body.getAttribute('data-theme') || 'light';
            const victoryColor = theme === 'dark' ? '#2ecc71' : '#157045'; // Lighter green for dark
            const defeatColor = theme === 'dark' ? '#e74c3c' : '#931024'; // Lighter red for dark

            new Chart(ctx, {
                type: 'pie', /* 'doughnut' can also be used */
                data: {
                    labels: ['Victories', 'Defeats'],
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
                            font: { size: 17 },
                            color: theme === 'dark' ? '#00cc99' : '#005252' // Adjust title color
                        },
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { size: 15 },
                                color: theme === 'dark' ? '#b0b0b0' : '#005252' // Adjust legend color
                            }
                        }
                    }
                }
            });
        }

        createChart("chartP1", players["p1"]);
        createChart("chartP2", players["p2"]);
        createChart("chartP3", players["p3"]);
        createChart("chartP4", players["p4"]);
    }

/*     // Assume this method exists in AbstractView.js
    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
    } */
}