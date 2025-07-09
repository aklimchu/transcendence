import GameView from "./GameView.js";
import { resetSettingsToDefault, TranslationManager, extractErrorMessage, applyFontSize, applyTheme } from "../utils.js";
import { authFetch } from "../auth.js";

export default class extends GameView {
    constructor(params) {
        super(params);
        this.translationManager = new TranslationManager();
        console.log("TournamentView.js version: 2025-07-04-fix-finalLeft");
    }

    async goToView() {
        let json;
        try {
            json = await this.fetchSessionData();
            if (!json || !json.data) {
                console.error("No session data available:", json);
                await this.goToNoAuth();
                return;
            }
            console.log("Session data:", JSON.stringify(json.data, null, 2));
        } catch (err) {
            console.error("Failed to fetch session data:", err);
            await this.goToNoAuth("Session expired. Please log in again.");
            return;
        }

        // Fetch user settings to get the language
        let settingsData = { language: "eng" };
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
                settingsData = { ...data.settings };
            } else {
                console.warn("Invalid settings response:", data);
                throw new Error("Invalid settings data received");
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
            //alert("Error loading settings: " + error.message);
            await this.goToNoAuth();
            return;
        }

        // Apply the theme and font to the body
        applyTheme(settingsData.theme);
        applyFontSize(settingsData.font_size);

        // Check for unfinished tournament; if none, show create tournament buttons
        if (json.data.unfinished_tournament === null) {
            console.log("No unfinished tournament, offering to create new");
            const content = `
                <div class="container text-center mt-5">
                    <div class="row justify-content-center">
                        <div class="col-md-6">
                            <button type="button" id="create_pong_tournament" class="custom-btn mb-3 pong" data-i18n="tournament.create_pong_tournament">Create Pong Tournament</button>
                            <button type="button" id="create_snek_tournament" class="custom-btn mb-3 snek" data-i18n="tournament.create_snek_tournament">Create Snek Tournament</button>
                        </div>
                    </div>
                    <div class="row mt-4">
                        <div class="col text-center">
                            <button type="button" id="reset-settings-btn" class="btn btn-primary" data-i18n="tournament.reset_settings">Reset Game Settings to Default</button>
                        </div>
                    </div>
                </div>`;
            this.unhideNavbar();
            await this.setContent(content);

            const translations = await this.translationManager.initLanguage(settingsData.language, [
                'tournament.title',
                'tournament.create_pong_tournament',
                'tournament.create_snek_tournament',
                'tournament.reset_settings'
            ]);
            const title = translations.tournament?.title || 'Tournament';
            this.setTitle(title);

            document.getElementById('reset-settings-btn').addEventListener('click', () => resetSettingsToDefault());
            return;
        }

        // Determine game type
        const game_type = json.data.unfinished_tournament.tournament_type === 'pong' ? 'pong' : 'snek';
        const theme = document.body.getAttribute('data-theme') || 'light';
        const buttonColor = theme === 'dark' ? '#003333' : '#005252';

        // Semifinal 1
        let semi1_div_content;
        if (json.data.unfinished_tournament.semi1_score === null) {
            const semi1Left = json.data.unfinished_tournament.semi_one_p1;
            const semi1Right = json.data.unfinished_tournament.semi_one_p2;
            console.log(`Semifinal 1 players: Left=${semi1Left}, Right=${semi1Right}`);
            semi1_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header" data-i18n="tournament.semifinal_1">Semifinal 1</div>
                    <div class="card-body">
                        <label for="semi1-left" class="form-label" data-i18n="tournament.left_player">Left Player</label>
                        <select id="semi1-left" class="form-select">
                            <option value="${semi1Left}">${semi1Left}</option>
                            <option value="${semi1Right}">${semi1Right}</option>
                        </select>
                        <label for="semi1-right" class="form-label mt-2" data-i18n="tournament.right_player">Right Player</label>
                        <select id="semi1-right" class="form-select">
                            <option value="${semi1Right}">${semi1Right}</option>
                            <option value="${semi1Left}">${semi1Left}</option>
                        </select>
                        <button type="button" class="play_game_btn btn btn-warning mt-3 ${game_type} 1v1 T1" data-left="semi1-left" data-right="semi1-right" style="background-color: ${buttonColor};" data-i18n="tournament.play_${game_type}" onclick="if (document.getElementById('semi1-left').value === document.getElementById('semi1-right').value) {  return; } console.log('T1 button clicked - Left:', document.getElementById('semi1-left').value, 'Right:', document.getElementById('semi1-right').value);">Play ${game_type}</button>
                    </div>
                </div>`;
        } else {
            semi1_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header" data-i18n="tournament.semifinal_1">Semifinal 1</div>
                    <div class="card-body">
                        <p><span class="fw-bold" data-i18n="tournament.winner">Winner</span>: ${json.data.unfinished_tournament.semi1_winner}</p>
                        <p><span class="fw-bold" data-i18n="tournament.loser">Loser</span>: ${json.data.unfinished_tournament.semi1_loser}</p>
                        <p><span class="fw-bold" data-i18n="tournament.score">Score</span>: ${json.data.unfinished_tournament.semi1_score}</p>
                    </div>
                </div>`;
        }

        // Semifinal 2
        let semi2_div_content;
        if (json.data.unfinished_tournament.semi2_score === null) {
            const semi2Left = json.data.unfinished_tournament.semi_two_p1;
            const semi2Right = json.data.unfinished_tournament.semi_two_p2;
            console.log(`Semifinal 2 players: Left=${semi2Left}, Right=${semi2Right}`);
            semi2_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header" data-i18n="tournament.semifinal_2">Semifinal 2</div>
                    <div class="card-body">
                        <label for="semi2-left" class="form-label" data-i18n="tournament.left_player">Left Player</label>
                        <select id="semi2-left" class="form-select">
                            <option value="${semi2Left}">${semi2Left}</option>
                            <option value="${semi2Right}">${semi2Right}</option>
                        </select>
                        <label for="semi2-right" class="form-label mt-2" data-i18n="tournament.right_player">Right Player</label>
                        <select id="semi2-right" class="form-select">
                            <option value="${semi2Right}">${semi2Right}</option>
                            <option value="${semi2Left}">${semi2Left}</option>
                        </select>
                        <button type="button" class="play_game_btn btn btn-warning mt-3 ${game_type} 1v1 T2" data-left="semi2-left" data-right="semi2-right" style="background-color: ${buttonColor};" data-i18n="tournament.play_${game_type}" onclick="if (document.getElementById('semi2-left').value === document.getElementById('semi2-right').value) { return; } console.log('T2 button clicked - Left:', document.getElementById('semi2-left').value, 'Right:', document.getElementById('semi2-right').value);">Play ${game_type}</button>
                    </div>
                </div>`;
        } else {
            semi2_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header" data-i18n="tournament.semifinal_2">Semifinal 2</div>
                    <div class="card-body">
                        <p><span class="fw-bold" data-i18n="tournament.winner">Winner</span>: ${json.data.unfinished_tournament.semi2_winner}</p>
                        <p><span class="fw-bold" data-i18n="tournament.loser">Loser</span>: ${json.data.unfinished_tournament.semi2_loser}</p>
                        <p><span class="fw-bold" data-i18n="tournament.score">Score</span>: ${json.data.unfinished_tournament.semi2_score}</p>
                    </div>
                </div>`;
        }

        // Final
        let final_div_content;
        if (json.data.unfinished_tournament.semi1_score !== null && json.data.unfinished_tournament.semi2_score !== null) {
            const finalLeft = json.data.unfinished_tournament.semi1_winner;
            const finalRight = json.data.unfinished_tournament.semi2_winner;
            console.log(`Final players: Left=${finalLeft}, Right=${finalRight}`);
            final_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header" data-i18n="tournament.final">Final</div>
                    <div class="card-body">
                        <label for="final-left" class="form-label" data-i18n="tournament.left_player">Left Player</label>
                        <select id="final-left" class="form-select">
                            <option value="${finalLeft}">${finalLeft}</option>
                            <option value="${finalRight}">${finalRight}</option>
                        </select>
                        <label for="final-right" class="form-label mt-2" data-i18n="tournament.right_player">Right Player</label>
                        <select id="final-right" class="form-select">
                            <option value="${finalRight}">${finalRight}</option>
                            <option value="${finalLeft}">${finalLeft}</option>
                        </select>
                        <button type="button" class="play_game_btn btn btn-danger mt-3 ${game_type} 1v1 T3" data-left="final-left" data-right="final-right" style="background-color: ${buttonColor};" data-i18n="tournament.play_${game_type}" onclick="if (document.getElementById('final-left').value === document.getElementById('final-right').value) { return; } console.log('T3 button clicked - Left:', document.getElementById('final-left').value, 'Right:', document.getElementById('final-right').value);">Play ${game_type}</button>
                    </div>
                </div>`;
        } else {
            final_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header" data-i18n="tournament.final">Final</div>
                    <div class="card-body">
                        <p><span class="fw-bold" data-i18n="tournament.waiting_for_semifinals">Waiting for semifinals...</span></p>
                    </div>
                </div>`;
        }

        // Total Content with Dropdown Validation
        const content = `
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-6">${semi1_div_content}</div>
                    <div class="col-md-6">${semi2_div_content}</div>
                </div>
                <div class="row justify-content-center mt-4">
                    <div class="col-md-8">${final_div_content}</div>
                </div>
            </div>
            <script>
                document.addEventListener('click', (e) => {
                    console.log('Click event:', e.target, 'Classes:', e.target.classList, 'ID:', e.target.id);
                });
                document.addEventListener('DOMContentLoaded', () => {
                    const semi1Left = document.getElementById('semi1-left');
                    const semi1Right = document.getElementById('semi1-right');
                    const semi2Left = document.getElementById('semi2-left');
                    const semi2Right = document.getElementById('semi2-right');
                    const finalLeft = document.getElementById('final-left');
                    const finalRight = document.getElementById('final-right');
                    if (semi1Left && semi1Right) {
                        semi1Left.value = '${json.data.unfinished_tournament.semi_one_p1}';
                        semi1Right.value = '${json.data.unfinished_tournament.semi_one_p2}';
                        semi1Left.addEventListener('change', () => {
                            if (semi1Left.value === semi1Right.value) {
                                semi1Left.value = '${json.data.unfinished_tournament.semi_one_p1}';
                            }
                        });
                        semi1Right.addEventListener('change', () => {
                            if (semi1Left.value === semi1Right.value) {
                                semi1Right.value = '${json.data.unfinished_tournament.semi_one_p2}';
                            }
                        });
                    }
                    if (semi2Left && semi2Right) {
                        semi2Left.value = '${json.data.unfinished_tournament.semi_two_p1}';
                        semi2Right.value = '${json.data.unfinished_tournament.semi_two_p2}';
                        semi2Left.addEventListener('change', () => {
                            if (semi2Left.value === semi2Right.value) {
                                semi2Left.value = '${json.data.unfinished_tournament.semi_two_p1}';
                            }
                        });
                        semi2Right.addEventListener('change', () => {
                            if (semi2Left.value === semi2Right.value) {
                                semi2Right.value = '${json.data.unfinished_tournament.semi_two_p2}';
                            }
                        });
                    }
                    console.log('Dropdown values set - Semi1 Left:', semi1Left?.value, 'Semi1 Right:', semi1Right?.value, 'Semi2 Left:', semi2Left?.value, 'Semi2 Right:', semi2Right?.value, 'Final Left:', finalLeft ? finalLeft.value : 'N/A', 'Final Right:', finalRight ? finalRight.value : 'N/A');
                });
            </script>`;
        this.unhideNavbar();
        await this.setContent(content);

        const translations = await this.translationManager.initLanguage(settingsData.language, [
            'tournament.title',
            'tournament.semifinal_1',
            'tournament.semifinal_2',
            'tournament.final',
            'tournament.left_player',
            'tournament.right_player',
            `tournament.play_${game_type}`,
            'tournament.winner',
            'tournament.loser',
            'tournament.score',
            'tournament.waiting_for_semifinals'
        ]);
        const title = translations.tournament?.title || 'Tournament';
        this.setTitle(title);
    }

    async goToResult() {
        try {
            var json = await this.fetchSessionData();
            if (!json || !json.data) {
                console.error("No session data for goToResult:", json);
                await this.goToNoAuth();
                return;
            }
            console.log("goToResult session data:", JSON.stringify(json.data, null, 2));
        } catch (err) {
            console.error("Failed to fetch session data in goToResult:", err);
            await this.goToNoAuth("Session expired. Please log in again.");
            return;
        }

        let settingsData = { language: "eng" };
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
                settingsData = { ...data.settings };
            } else {
                console.warn("Invalid settings response:", data);
                throw new Error("Invalid settings data received");
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
            alert("Error loading settings: " + error.message);
        }

        if (!json.data.finished_tournaments || json.data.finished_tournaments.length === 0) {
            console.error("No finished tournaments found");
            await this.goToView();
            return;
        }

        // Apply the theme and font to the body
        applyTheme(settingsData.theme);
        applyFontSize(settingsData.font_size);

        const content = `
            <div class="container my-3">
                <button type="button" id="tournament_view" class="btn btn-secondary mb-4" sub-view-reference data-i18n="tournament.go_back">Go back</button>
                <h3 class="text-center mb-4" data-i18n="tournament.tournament_completed">Tournament Completed!</h3>
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="card mb-3 p-4 fs-5">
                            <div class="card-header" data-i18n="tournament.semifinal_1">Semifinal 1</div>
                            <div class="card-body">
                                <p><span class="fw-bold" data-i18n="tournament.winner">Winner</span>: ${json.data.finished_tournaments[0].semi1_winner}</p>
                                <p><span class="fw-bold" data-i18n="tournament.loser">Loser</span>: ${json.data.finished_tournaments[0].semi1_loser}</p>
                                <p><span class="fw-bold" data-i18n="tournament.score">Score</span>: ${json.data.finished_tournaments[0].semi1_score}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card mb-3 p-4 fs-5">
                            <div class="card-header" data-i18n="tournament.semifinal_2">Semifinal 2</div>
                            <div class="card-body">
                                <p><span class="fw-bold" data-i18n="tournament.winner">Winner</span>: ${json.data.finished_tournaments[0].semi2_winner}</p>
                                <p><span class="fw-bold" data-i18n="tournament.loser">Loser</span>: ${json.data.finished_tournaments[0].semi2_loser}</p>
                                <p><span class="fw-bold" data-i18n="tournament.score">Score</span>: ${json.data.finished_tournaments[0].semi2_score}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row justify-content-center">
                    <div class="col-md-8">
                        <div class="card p-4 fs-5">
                            <div class="card-header" data-i18n="tournament.final">Final</div>
                            <div class="card-body">
                                <p><span class="fw-bold" data-i18n="tournament.winner">Winner</span>: ${json.data.finished_tournaments[0].final_winner}</p>
                                <p><span class="fw-bold" data-i18n="tournament.loser">Loser</span>: ${json.data.finished_tournaments[0].final_loser}</p>
                                <p><span class="fw-bold" data-i18n="tournament.score">Score</span>: ${json.data.finished_tournaments[0].final_score}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        this.unhideNavbar();
        await this.setContent(content);

        const translations = await this.translationManager.initLanguage(settingsData.language, [
            'tournament.title',
            'tournament.tournament_completed',
            'tournament.go_back',
            'tournament.semifinal_1',
            'tournament.semifinal_2',
            'tournament.final',
            'tournament.winner',
            'tournament.loser',
            'tournament.score'
        ]);
        const title = translations.tournament?.title || 'Tournament';
        this.setTitle(title);
    }

    async display_result(tournament) {
        console.log("display_result called with tournament:", tournament);
        if (tournament === 3) {
            await this.goToResult();
        } else {
            console.log("Calling goToView from display_result");
            await this.goToView();
        }
    }
}