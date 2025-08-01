import AbstractView from "./AbstractView.js";
import { authFetch } from "../auth.js";
import { TranslationManager, extractErrorMessage, applyFontSize, applyTheme } from "../utils.js"

export default class extends AbstractView
{
    constructor(params)
    {
        super(params);
        this.translationManager = new TranslationManager();
        this.matchHistories = { p1: [], p2: [], p3: [], p4: [] };
        this.tooltipStates = { p1: false, p2: false, p3: false, p4: false };
    }

    // Function to generate Match History table
    generateMatchHistoryTable(history, translations) {
        if (!history || history.length === 0) {
            return `<p>${translations.stats.no_history || 'No match history available'}</p>`;
        }
        let table = `
            <table class="match-history-table">
                <tr>
                    <th>${translations.stats.game_type || 'Game Type'}</th>
                    <th>${translations.stats.date || 'Date'}</th>
                    <th>${translations.stats.opponent || 'Opponent'}</th>
                    <th>${translations.stats.score || 'Score'}</th>
                    <th>${translations.stats.outcome || 'Outcome'}</th>
                </tr>`;
        history.forEach(game => {
            let playerScore, opponentScore;
            const cleanScore = game.score.replace(/\s/g, '');
            const scoreParts = cleanScore.split('-').map(Number);
            console.log(`Processing game: score=${game.score}, cleanScore=${cleanScore}, outcome=${game.outcome}`);
            if (scoreParts.length === 2 && !isNaN(scoreParts[0]) && !isNaN(scoreParts[1])) {
                if (game.outcome.toLowerCase() === 'win') {
                    // For a win, player has the higher score
                    [playerScore, opponentScore] = scoreParts[0] >= scoreParts[1] ? scoreParts : [scoreParts[1], scoreParts[0]];
                    console.log(`Win: playerScore=${playerScore}, opponentScore=${opponentScore}`);
                } else if (game.outcome.toLowerCase() === 'loss') {
                    // For a loss, player has the lower score
                    [playerScore, opponentScore] = scoreParts[0] < scoreParts[1] ? scoreParts : [scoreParts[1], scoreParts[0]];
                    console.log(`Loss: playerScore=${playerScore}, opponentScore=${opponentScore}`);
                } else {
                    // Fallback for unexpected outcome
                    playerScore = opponentScore = 0;
                    console.warn(`Unexpected outcome for game: ${game.outcome}, setting score to 0-0`);
                }
            } else {
                // Fallback if score format is invalid
                playerScore = opponentScore = 0;
                console.warn(`Invalid score format for game: ${game.score}, cleanScore=${cleanScore}`);
            }
            const formattedScore = `${playerScore}-${opponentScore}`;
            // Validate date; use "Unknown" if invalid or missing
            const formattedDate = game.date && typeof game.date === 'string' && game.date.match(/^\d{2}\.\d{2}\.\d{4}$/) 
                ? game.date 
                : translations.stats.unknown_date || 'Unknown';
            table += `
                <tr>
                    <td>${game.game_type}</td>
                    <td>${formattedDate}</td>
                    <td>${game.opponent}</td>
                    <td>${formattedScore}</td>
                    <td>${translations.stats[`outcome_${game.outcome.toLowerCase()}`] || game.outcome}</td>
                </tr>`;
        });
        table += '</table>';
        return table;
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
            console.log("Fetching settings from /pong_api/pong_settings/update");
            const response = await authFetch("/pong_api/pong_settings/update", {
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
                settingsData = { theme: "light", font_size: "medium",  language: "eng"};
                throw new Error("Invalid settings data received");
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
            await this.goToNoAuth();
            return;
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
        }

        // Apply the theme and font to the body
        applyTheme(settingsData.theme);
        applyFontSize(settingsData.font_size);

const content = `
        <style>
            .match-history-tooltip {
                position: absolute;
                background: ${settingsData.theme === 'dark' ? '#333' : '#fff'};
                color: ${settingsData.theme === 'dark' ? '#fff' : '#333'};
                border: 1px solid #ccc;
                padding: 10px;
                z-index: 1000;
                display: none;
                max-width: 400px;
                width: auto;
                box-sizing: border-box;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                border-radius: 5px;
            }
            .match-history-button {
                margin-top: 10px;
                padding: 5px 10px;
                background: ${settingsData.theme === 'dark' ? '#2ecc71' : '#005252'};
                color: ${settingsData.theme === 'dark' ? '#333333' : 'white'};
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }
            .match-history-button:hover {
                background: ${settingsData.theme === 'dark' ? '#25a259' : '#003838'};
            }
            .match-history-table {
                width: 100%;
                border-collapse: collapse;
                font-size: ${settingsData.font_size === 'small' ? '12px' : settingsData.font_size === 'large' ? '16px' : '14px'};
            }
            .match-history-table th, .match-history-table td {
                padding: 5px;
                border-bottom: 1px solid ${settingsData.theme === 'dark' ? '#555' : '#ddd'};
                text-align: left;
            }
            .match-history-table th {
                background: ${settingsData.theme === 'dark' ? '#444' : '#f0f0f0'};
            }
            .stats-container {
                position: relative;
                overflow: visible;
            }
            .stats-card {
                border: 3px solid var(--border-color);
                background-color: var(--bg-secondary);
                border-radius: 10px;
                height: 90vh;
                padding: 1rem;
                font-size: var(--base-font-size);
            }
        </style>
        <div class="stats-container my-2">
            <div class="stats-card text-center">
                <h3 class="stats-title mb-3" data-i18n="stats.title">🏓Player Performance Overview🐍</h3>
                <div class="row row-cols-1 row-cols-md-2 g-4">
                    <div class="col">
                        <canvas id="chartP1" data-player-key="p1"></canvas>
                        <button class="match-history-button" data-player-key="p1" data-i18n="stats.match_history">Match History</button>
                        <div class="match-history-tooltip" id="tooltip-p1"></div>
                    </div>
                    <div class="col">
                        <canvas id="chartP2" data-player-key="p2"></canvas>
                        <button class="match-history-button" data-player-key="p2" data-i18n="stats.match_history">Match History</button>
                        <div class="match-history-tooltip" id="tooltip-p2"></div>
                    </div>
                    <div class="col">
                        <canvas id="chartP3" data-player-key="p3"></canvas>
                        <button class="match-history-button" data-player-key="p3" data-i18n="stats.match_history">Match History</button>
                        <div class="match-history-tooltip" id="tooltip-p3"></div>
                    </div>
                    <div class="col">
                        <canvas id="chartP4" data-player-key="p4"></canvas>
                        <button class="match-history-button" data-player-key="p4" data-i18n="stats.match_history">Match History</button>
                        <div class="match-history-tooltip" id="tooltip-p4"></div>
                    </div>
                </div>
            </div>
        </div>
        `;
        this.unhideNavbar();
        await this.setContent(content);

        const translations = await this.translationManager.initLanguage(settingsData.language, [
            'stats.title',
            'lobby.victories',
            'lobby.defeats',
            'stats.game_type',
            'stats.date',
            'stats.opponent',
            'stats.score',
            'stats.outcome',
            'stats.no_history'
        ]);
        
        const title = translations.stats?.page_title || 'Stats';
        this.setTitle(title);

        const buttons = document.querySelectorAll('.match-history-button');
        buttons.forEach(button => {
            const playerKey = button.getAttribute('data-player-key');
            const tooltip = document.getElementById(`tooltip-${playerKey}`);
            console.log(`Button playerKey: ${playerKey}`);

            button.addEventListener('click', (event) => {
                event.stopPropagation();
                this.tooltipStates[playerKey] = !this.tooltipStates[playerKey];
                if (this.tooltipStates[playerKey]) {
                    tooltip.innerHTML = this.generateMatchHistoryTable(this.matchHistories[playerKey], translations);
                    tooltip.style.display = 'block';
                    tooltip.style.visibility = 'hidden';
                    const rect = button.getBoundingClientRect();
                    const isLeftColumn = ['p1', 'p3'].includes(playerKey);
                    const topPosition = rect.bottom + window.scrollY - tooltip.offsetHeight - 5 - 100;
                    let leftPosition = isLeftColumn 
                        ? rect.left + window.scrollX - 1250
                        : rect.right + window.scrollX - tooltip.offsetWidth - 280;
                    // Viewport bounds checking
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    // Ensure tooltip stays within viewport horizontally
                    if (leftPosition < -200) {
                        leftPosition = -200;
                    } else if (leftPosition + tooltip.offsetWidth > viewportWidth - 10) {
                        leftPosition = viewportWidth - tooltip.offsetWidth - 10;
                    }
                    // Ensure tooltip stays within viewport vertically
                    let adjustedTop = topPosition;
                    if (adjustedTop < 10) {
                        adjustedTop = 10;
                    } else if (adjustedTop + tooltip.offsetHeight > viewportHeight - 10) {
                        adjustedTop = viewportHeight - tooltip.offsetHeight - 10;
                    }
                    console.log(`Player: ${playerKey}, isLeftColumn: ${isLeftColumn}, rect.left: ${rect.left}, rect.right: ${rect.right}, tooltip.width: ${tooltip.offsetWidth}, tooltip.height: ${tooltip.offsetHeight}, top: ${adjustedTop}, left: ${leftPosition}, viewportWidth: ${viewportWidth}, viewportHeight: ${viewportHeight}`);
                    tooltip.style.top = `${adjustedTop}px`;
                    tooltip.style.left = `${leftPosition}px`;
                    tooltip.style.visibility = 'visible';
                } else {
                    tooltip.style.display = 'none';
                }
            });
        });

        document.addEventListener('click', (event) => {
            const tooltips = document.querySelectorAll('.match-history-tooltip');
            tooltips.forEach(tooltip => {
                if (!event.target.closest('.match-history-button')) {
                    tooltip.style.display = 'none';
                    Object.keys(this.tooltipStates).forEach(key => {
                        const tooltip = document.getElementById(`tooltip-${key}`);
                        if (tooltip.style.display === 'none') {
                            this.tooltipStates[key] = false;
                        }
                    });
                }
            });
        });

        function createChart(id, player, translations) {
            const ctx = document.getElementById(id).getContext('2d');
            const theme = document.body.getAttribute('data-theme') || 'light';
            const font_size = settingsData.font_size || 'medium';
        
            // Color mappings for theme
            const victoryColor = theme === 'dark' ? '#2ecc71' : '#157045';
            const defeatColor = theme === 'dark' ? '#e74c3c' : '#931024';
            const titleColor = theme === 'dark' ? '#2ecc71' : '#005252';
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