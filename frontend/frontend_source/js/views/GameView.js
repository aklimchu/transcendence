import AbstractView from "./AbstractView.js";
import { authFetch, getCookie } from '../auth.js';
import { resetSettingsToDefault, TranslationManager, extractErrorMessage } from "../utils.js";

export default class extends AbstractView {
    constructor(params) {
        super(params);
        this.translationManager = new TranslationManager();
    }

    async goToView() {
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

        // Fetch settings to get language
        let settingsData = {
            game_speed: "normal",
            ball_size: "medium",
            paddle_size: "normal",
            power_jump: "on",
            theme: "light",
            font_size: "medium",
            language: "eng",
            players: Array(4).fill().map((_, index) => ({ player_name: '', position: index + 1 }))
        };
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
                throw new Error("Invalid settings data received");
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
            alert("Error loading settings: " + error.message);
        }

        // Fetch win/loss data for all players
        const playerStats = {};
        const players = Object.values(json.data.players);
        const playerIds = players.map(p => p.id);
        for (const playerId of playerIds) {
            try {
                const response = await authFetch(`/pong_api/player_match_history/${playerId}/`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" }
                });
                const data = await response.json();
                if (data.ok) {
                    const wins = data.data.filter(game => game.outcome === "win").length;
                    const losses = data.data.filter(game => game.outcome === "loss").length;
                    const total = wins + losses;
                    const ratio = total > 0 ? wins / total : 0;
                    playerStats[playerId] = { wins, losses, ratio };
                } else {
                    playerStats[playerId] = { wins: 0, losses: 0, ratio: 0 };
                }
            } catch (error) {
                console.error(`Failed to fetch stats for player ${playerId}:`, error);
                playerStats[playerId] = { wins: 0, losses: 0, ratio: 0 };
            }
        }

        // Determine the best opponent for Player 1 (p1)
        const defaultLeftPlayerId = json.data.players.p1.id;
        const defaultLeftRatio = playerStats[defaultLeftPlayerId].ratio;
        let bestOpponentId = null;
        let minRatioDiff = Infinity;
        // Prioritize players other than p1
        for (const [id, stats] of Object.entries(playerStats)) {
            if (String(id) !== String(defaultLeftPlayerId)) {
                const diff = Math.abs(stats.ratio - defaultLeftRatio);
                if (diff < minRatioDiff) {
                    minRatioDiff = diff;
                    bestOpponentId = id;
                    console.log(`Now id for Best Opponent is ${bestOpponentId} (type: ${typeof bestOpponentId})`);
                }
            }
        }
        // Fallback: Choose the first non-p1 player if no valid opponent is found
        if (!bestOpponentId) {
            bestOpponentId = players.find(p => String(p.id) !== String(defaultLeftPlayerId))?.id || json.data.players.p2.id;
        }
        console.log(`Final bestOpponentId: ${bestOpponentId} (type: ${typeof bestOpponentId}), defaultLeftPlayerId: ${defaultLeftPlayerId} (type: ${typeof defaultLeftPlayerId})`);
        console.log(`Player data: ${JSON.stringify(players)}`);

        var content = `
        <div class="container-fluid py-4">
            <div class="row teal-container">
                <div class="hover-overlay" data-i18n="game.1v1">1v1 Mode</div>
                <div class="col teal-box d-flex flex-column justify-content-center align-items-center">
                    <div class="mb-3">
                        <label for="left-select" data-i18n="game.pick_left">Pick left player:</label>
                        <select name="LeftPlayer" id="left-select" class="form-select">
                            ${players.map(p => `
                                <option value="${p.id}" ${String(p.id) === String(defaultLeftPlayerId) ? 'selected' : ''}>${p.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="right-select" data-i18n="game.pick_right">Pick right player:</label>
                        <select name="RightPlayer" id="right-select" class="form-select">
                            ${players.map(p => `
                                <option value="${p.id}" ${String(p.id) === String(bestOpponentId) ? 'selected' : ''}>${p.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="d-flex gap-3">
                        <button type="button" class="btn btn-warning play_game_btn pong 1v1 T0" data-left="left-select" data-right="right-select" data-i18n="game.play_pong">Play Pong</button>
                        <button type="button" class="btn btn-secondary play_game_btn snek 1v1 T0" data-left="left-select" data-right="right-select" data-i18n="game.play_snek">Play Snek</button>
                    </div>
                </div>
            </div>

            <div class="row teal-container">
                <div class="hover-overlay" data-i18n="game.2v2">2v2 Mode</div>
                <div class="col teal-box d-flex flex-column justify-content-center align-items-center">
                    <div class="row mb-2">
                        <div class="col">
                            <label for="left-select1" data-i18n="game.pick_left_player_1">Pick left player 1:</label>
                            <select name="LeftPlayer1" id="left-select1" class="form-select">
                                ${players.map(p => `<option>${p.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col">
                            <label for="right-select1" data-i18n="game.pick_right_player_1">Pick right player 1:</label>
                            <select name="RightPlayer1" id="right-select1" class="form-select">
                                ${players.map(p => `<option>${p.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="row mb-4">
                        <div class="col">
                            <label for="left-select2" data-i18n="game.pick_left_player_2">Pick left player 2:</label>
                            <select name="LeftPlayer2" id="left-select2" class="form-select">
                                ${players.map(p => `<option>${p.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col">
                            <label for="right-select2" data-i18n="game.pick_right_player_2">Pick right player 2:</label>
                            <select name="RightPlayer2" id="right-select2" class="form-select">
                                ${players.map(p => `<option>${p.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="d-flex gap-3">
                        <button type="button" class="btn btn-warning play_game_btn pong 2v2 T0" data-i18n="game.play_pong">Play Pong</button>
                        <button type="button" class="btn btn-secondary play_game_btn snek 2v2 T0" data-i18n="game.play_snek">Play Snek</button>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col text-center">
                    <button type="button" id="reset-settings-btn" class="btn btn-primary" data-i18n="game.reset_settings">Reset Game Settings to Default</button>
                </div>
            </div>
        </div>
        <script>
            // Ensure correct dropdown selections after rendering
            document.addEventListener('DOMContentLoaded', function () {
                const leftSelect = document.getElementById('left-select');
                const rightSelect = document.getElementById('right-select');
                leftSelect.value = '${defaultLeftPlayerId}';
                rightSelect.value = '${bestOpponentId}';
                console.log('Left select value:', leftSelect.value, 'type:', typeof leftSelect.value);
                console.log('Right select value:', rightSelect.value, 'type:', typeof rightSelect.value);
            });
        </script>
        `;
        this.setTitle("Game");
        this.unhideNavbar();
        await this.setContent(content);

        // Apply translations
        const translations = await this.translationManager.initLanguage(settingsData.language, [
            'game.1v1',
            'game.2v2',
            'game.pick_left',
            'game.pick_right',
            'game.pick_left_player_1',
            'game.pick_right_player_1',
            'game.pick_left_player_2',
            'game.pick_right_player_2',
            'game.play_pong',
            'game.play_snek',
            'game.reset_settings'
        ]);

        // Add event listener for the reset settings button
        document.getElementById('reset-settings-btn').addEventListener('click', () => resetSettingsToDefault());
    }

    async goToResult() {
        try {
            var json = await this.fetchSessionData();
            if (!json || !json.data) {
                await this.goToNoAuth();
                return;
            }
        } catch (err) {
            await this.goToNoAuth("Session expired. Please log in again.");
            return;
        }

        // Fetch settings to get language
        let settingsData = {
            language: "eng"
        };
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

        var game = json.data["games"][0];

        var l1, l2, r1, r2, score_str, score_arr;

        score_str = game["score"];
        score_arr = score_str.split(" - ");

        l1 = (score_arr[0] > score_arr[1]) ? game["winner_1"] : game["loser_1"];
        l2 = (score_arr[0] > score_arr[1]) ? game["winner_2"] : game["loser_2"];
        r1 = (score_arr[0] > score_arr[1]) ? game["loser_1"] : game["winner_1"];
        r2 = (score_arr[0] > score_arr[1]) ? game["loser_2"] : game["winner_2"];

        l1 = (l1 === null) ? "" : l1;
        l2 = (l2 === null) ? "" : l2;
        r1 = (r1 === null) ? "" : r1;
        r2 = (r2 === null) ? "" : r2;

        var content = `
            <div class="container my-6">
                <button type="button" id="game_view" class="go-back-btn btn btn-secondary mb-4" sub-view-reference data-i18n="game.go_back">Go back</button>
                <h3 class="game-status-card p-3 text-center mb-4" data-i18n="game.game_completed">Game Completed!</h3>
                <div class="game-card p-4 fs-5">
                    <div class="game-card-body">
                        <div class="row text-center">
                            <div class="col">
                                <h5 class="side-text-color">Left Side</h5>
                                <p>${l1}</p>
                                ${l2 ? `<p>${l2}</p>` : ""}
                            </div>
                            <div class="col align-self-center">
                                <h4>${score_str}</h4>
                            </div>
                            <div class="col">
                                <h5 class="side-text-color">Right Side</h5>
                                <p>${r1}</p>
                                ${r2 ? `<p>${r2}</p>` : ""}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.unhideNavbar();
        await this.setContent(content);

        // Apply translations
        const translations = await this.translationManager.initLanguage(settingsData.language, ['game.game_completed', 'game.go_back']);
		
        // Set translated page title
        const title = translations.game?.title || 'Game';
        this.setTitle(title);
    }

    async play_pong(player_left1, player_left2, player_right1, player_right2, tournament)
    {
        await this.goToGameView();

        let settingsData = {
            game_speed: "normal",
            ball_size: "medium",
            paddle_size: "normal",
            power_jump: "on",
            theme: "light",
            font_size: "medium",
            language: "eng",
            players: Array(4).fill().map((_, index) => ({ player_name: '', position: index + 1 }))
        };

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
                throw new Error("Invalid settings data received");
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
            alert("Error loading settings: " + error.message);
        }

        var game_data = {};

        game_data.game_type = 'pong';

        game_data.fps = 100;
        game_data.delay = 1000 / game_data.fps;

        game_data.paused = false;
        game_data.end = false;
        game_data.score = [0,0];
        game_data.max_score = 5;

        game_data.balls = [];
        game_data.players = [];
        game_data.tournament = tournament;

        game_data.grid = 15;
        game_data.paddleHeight = game_data.grid * 5;
        game_data.canvas = document.getElementById('pong');
        game_data.context = game_data.canvas.getContext('2d');
        game_data.max_y = game_data.canvas.height - game_data.grid - game_data.paddleHeight;

        let ball_speed = 7;
        if (settingsData.game_speed == "fast")
            ball_speed = 9;
        else if (settingsData.game_speed == "slow")
            ball_speed = 5;

        this.create_pong_ball(game_data, 'ball1', 0.5, 0.5, ball_speed, 'left', settingsData.ball_size);

        if (player_left2 === null && player_right2 === null)
        {
            this.create_pong_player(game_data, player_left1, 'left', 0.5, 6, 'w', 's', settingsData.paddle_size);
            this.create_pong_player(game_data, player_right1, 'right', 0.5, 6, 'ArrowUp', 'ArrowDown', settingsData.paddle_size);   
        }
        else
        {
            this.create_pong_player(game_data, player_left1, 'left', 1/3, 6, 'w', 's', settingsData.paddle_size);
            this.create_pong_player(game_data, player_right1, 'right', 1/3, 6, 'ArrowUp', 'ArrowDown', settingsData.paddle_size);
            this.create_pong_player(game_data, player_left2, 'left', 2/3, 6, 'd', 'c', settingsData.paddle_size);
            this.create_pong_player(game_data, player_right2, 'right', 2/3, 6, 'o', 'l', settingsData.paddle_size);
        }    

        document.addEventListener('keydown', e => this.pause_listener(e, game_data));

        return await new Promise(resolve => {requestAnimationFrame(resolve);}).then(this.pong_loop.bind(this, game_data));
    }

    async pong_loop(game_data)
    {
        game_data.canvas.focus();

        if (!game_data.paused)
        {
            game_data.players.forEach(this.move_pong_player.bind(null, game_data));
            game_data.balls.forEach(this.move_pong_ball.bind(this, game_data));
            game_data.players.forEach(this.handle_pong_players.bind(this, game_data));
            this.draw_pong_frame(game_data);
        }

        if (game_data.end)
            return this.handle_game_end.bind(this, game_data)();
        else
        {
            await new Promise(r => setTimeout(r, game_data.delay));
            return new Promise(resolve => {requestAnimationFrame(resolve);}).then(this.pong_loop.bind(this, game_data));
        }
    }

    create_pong_ball(game_data, name, x, y, speed, left, size)
    {
        var ball =
        {
            name : name,
            x: game_data.canvas.width * x,
            y: game_data.canvas.height * y,
            width: game_data.grid,
            height: game_data.grid,
            resetting: false,
            speed: speed,
            dx: (left === 'left' ? speed : -speed),
            dy: speed,
        }

        if (size == "large") {
            ball.width *= 2;
            ball.height *= 2;
        }
        else if (size == "small") {
            ball.width *= 0.5;
            ball.height *= 0.5;
        }

        game_data.balls.push(ball);
    }

    create_pong_player(game_data, name, side, start_y, speed, up, down, size)
    {
        var player =
        {
            name: name,
            side: (side === "left" ? "left" : "right"),
            x: (side === "left" ? game_data.grid * 0 : game_data.canvas.width - game_data.grid),
            y: (game_data.canvas.height - game_data.paddleHeight) * start_y,
            width: game_data.grid,
            height: game_data.paddleHeight,
            speed: speed,
            dy: 0
        };

        if (size == "long") {
            player.height *= 1.5;
        }
        else if (size == "short") {
            player.height *= 0.7;
        }

        this.add_pong_player_listeners(player, up, down);

        game_data.players.push(player);
    }

    move_pong_player(game_data, player) {
        const newY = player.y + player.dy;
        if (newY < game_data.grid) {
            player.y = game_data.grid;
        } else if (newY + player.height > game_data.canvas.height - game_data.grid) {
            player.y = game_data.canvas.height - game_data.grid - player.height;
        } else {
            player.y = newY;
        }
    }

    move_pong_ball(game_data, ball)
    {
        ball.x += ball.dx;
        ball.y += ball.dy;

        if (ball.y < game_data.grid || ball.y + ball.height > game_data.canvas.height - game_data.grid) {
            if (ball.y < game_data.grid) {
                ball.y = game_data.grid;
            } else {
                ball.y = game_data.canvas.height - game_data.grid - ball.height;
            }
            ball.dy *= -1;
        }

        if ((ball.x < 0 || ball.x > game_data.canvas.width) && !ball.resetting)
        {
            ball.resetting = true;
            ball.x > game_data.canvas.width ? game_data.score[0]++ : game_data.score[1]++;
            setTimeout(this.reset_pong_ball.bind(this, ball, game_data), 400);
        }
    }

    handle_pong_players(game_data, player)
    {
        game_data.balls.forEach(this.handle_pong_collision.bind(null, player));
    }

    handle_pong_collision(player, ball)
    {
        if (ball.resetting)
            return;

        if ((ball.x < player.x + player.width) && (ball.x + ball.width > player.x) && (ball.y < player.y + player.height) && (ball.y + ball.height > player.y))
        {
            ball.dx *= -1;
            if (player.side === "left") {
                ball.x = player.x + player.width;
            } else {
                ball.x = player.x - ball.width;
            }
        }
    }

    draw_pong_frame(game_data)
    {
        this.draw_pong_background(game_data);
        game_data.players.forEach(this.draw_pong_object.bind(null, game_data));
        game_data.balls.forEach(this.draw_pong_object.bind(null, game_data));
    }

    draw_pong_background(game_data)
    {
        var ctx = game_data.context;
        var cnv = game_data.canvas;

        ctx.fillStyle = 'black';
        ctx.clearRect(0, 0, cnv.width, cnv.height);
        ctx.fillRect(0, 0, cnv.width, cnv.height);

        ctx.fillStyle = 'orange';
        ctx.fillRect(0, 0, cnv.width, game_data.grid);
        ctx.fillRect(0, cnv.height - game_data.grid, cnv.width, cnv.height);
        for (let i = game_data.grid; i < cnv.height - game_data.grid; i += game_data.grid * 2)
            ctx.fillRect(cnv.width / 2 - game_data.grid / 2, i, game_data.grid, game_data.grid);

        ctx.textAlign = 'center', ctx.font = '50px "Press Start 2P", Arial, sans-serif', ctx.fillStyle = 'white';
        ctx.fillText(game_data.score[0] + '  ' + game_data.score[1], cnv.width / 2, cnv.height * 0.2);
    }

    draw_pong_object(game_data, object)
    {
        game_data.context.fillStyle = 'white';
        game_data.context.fillRect(object.x, object.y, object.width, object.height);
    }

    add_pong_player_listeners(player, up, down)
    {
        document.addEventListener('keydown', e => this.pong_player_keydown_listener(e, player, up, down));
        document.addEventListener('keyup', e => this.pong_player_keyup_listener(e, player, up, down));
    }

    pong_player_keydown_listener(e, player, up, down)
    {
        if (e.key === up)
            player.dy = -player.speed;
        else if (e.key === down)
            player.dy = player.speed;
    }

    pong_player_keyup_listener(e, player, up, down)
    {
        if (e.key === up || e.key === down)
            player.dy = 0;
    }

    reset_pong_ball(ball, game_data)
    {
        if (game_data.score[0] >= game_data.max_score || game_data.score[1] >= game_data.max_score)
            game_data.end = true;
        else
        {
            ball.resetting = false;
            ball.x = game_data.canvas.width / 2;
            ball.y = game_data.canvas.height / 2;
        }
    }

    async play_snek(player_left1, player_left2, player_right1, player_right2, tournament)
    {
        await this.goToGameView();

        let settingsData = {
            game_speed: "normal",
            ball_size: "medium",
            paddle_size: "normal",
            power_jump: "on",
            theme: "light",
            font_size: "medium",
            language: "eng",
            players: Array(4).fill().map((_, index) => ({ player_name: '', position: index + 1 }))
        };

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
                throw new Error("Invalid settings data received");
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
            alert("Error loading settings: " + error.message);
        }

        var game_data = {};

        game_data.game_type = 'snek';

        game_data.fps = 8;
        if (settingsData.game_speed == "slow")
            game_data.fps = 5;
        else if (settingsData.game_speed == "fast")
            game_data.fps = 12;
        game_data.delay = 1000 / game_data.fps;

        game_data.players = [];
        game_data.score = [0,0];
        game_data.tournament = tournament;

        game_data.grid = 15;
        game_data.paused = false;
        game_data.visited_cells = new Set();
        game_data.canvas = document.getElementById('pong');
        game_data.context = game_data.canvas.getContext('2d');
        game_data.cols = game_data.canvas.width / game_data.grid;
        game_data.rows = game_data.canvas.height / game_data.grid;

        let power_jump = true;
        if (settingsData.power_jump == "off")
            power_jump = false;

        if (player_left2 === null && player_right2 === null)
        {
            this.create_snek_player(game_data, player_left1, 'left', '#24a7a1', 20, 4, 1, 0, 'w', 's', 'a', 'd', 'r', power_jump);
            this.create_snek_player(game_data, player_right1, 'right', '#ff9810', 20, 55, -1, 0, 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', "l", power_jump);
        }
        else
        {
            this.create_snek_player(game_data, player_left1, 'left', '#24a7a1', 10, 4, 1, 0, 'w', 's', 'a', 'd', 'r', power_jump);
            this.create_snek_player(game_data, player_right1, 'right', '#ff9810', 10, 55, -1, 0, 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', "l", power_jump);
            this.create_snek_player(game_data, player_left2, 'left', '#24a7a1', 30, 4, 1, 0, '1', '2', '3', '4', '5', power_jump);
            this.create_snek_player(game_data, player_right2, 'right', '#ff9810', 30, 55, -1, 0, '6', '7', '8', '9', "0", power_jump);
        }

        this.draw_initial_snek_frame.bind(this, game_data)();

        document.addEventListener('keydown', e => this.pause_listener(e, game_data));

        await new Promise(resolve => {requestAnimationFrame(resolve);}).then(this.snek_loop.bind(this, game_data));
        console.log('---------- END ----------');
    }

    async snek_loop(game_data)
    {
        game_data.canvas.focus();

        if (!game_data.paused)
            game_data.players.forEach(this.handle_snek_player.bind(this, game_data));

        if (game_data.players.filter(player => player.dead === true).length === 0)
        {
            await new Promise(r => setTimeout(r, game_data.delay));
            return new Promise(resolve => {requestAnimationFrame(resolve);}).then(this.snek_loop.bind(this, game_data));
        }
        else
        {
            game_data.score[0] = game_data.players.filter(player => player.dead === false && player.side === 'left').length;
            game_data.score[1] = game_data.players.filter(player => player.dead === false && player.side === 'right').length;

            if (game_data.score[0] !== game_data.score[1])
            {
                return this.handle_game_end.bind(this, game_data)();
            }
            else
            {
                await new Promise(r => setTimeout(r, 400));
                this.reset_snek_game(game_data);
                return new Promise(resolve => {requestAnimationFrame(resolve);}).then(this.snek_loop.bind(this, game_data));
            }
        }
    }

    handle_snek_player(game_data, player)
    {
        if (!this.snek_move_to_cell(game_data, player))
            player.dead = true;

        if (!player.dead)
        {
            game_data.context.fillStyle = player.color;
            game_data.context.fillRect(player.x * game_data.grid, player.y * game_data.grid, game_data.grid, game_data.grid);
            game_data.context.strokeStyle = 'black';
            game_data.context.strokeRect(player.x * game_data.grid, player.y * game_data.grid, game_data.grid, game_data.grid);
            player.x += player.dx;
            player.y += player.dy;
        }
    }

    snek_move_to_cell(game_data, player)
    {
        var current_cell = `${player.x}-${player.y}`

        if (player.x < 0 || player.x >= game_data.cols || player.y < 0 || player.y >= game_data.rows)
            return false;
        if (game_data.visited_cells.has(current_cell))
            return false;
        game_data.visited_cells.add(current_cell);
        return true;
    }

    create_snek_player(game_data, name, side, color, y, x, dx, dy, up, down, left, right, jump, bool_jump)
    {
        var player = 
        {
            name: name,
            color: color,
            side: (side === "left" ? "left" : "right"),
            dead: false,
            x: x,
            y: y,
            dx: dx,
            dy: dy,
            start_x: x,
            start_y: y,
            start_dx: dx,
            start_dy: dy
        };

        this.add_snek_player_listeners(player, up, down, left, right, jump, bool_jump);

        game_data.players.push(player);
    }

    draw_initial_snek_frame(game_data)
    {
        this.draw_snek_background(game_data);
        game_data.players.forEach(this.draw_snek_start.bind(null, game_data));
    }

    draw_snek_start(game_data, player)
    {
        var grd = game_data.grid;

        game_data.context.fillStyle = player.color;
        game_data.context.fillRect(player.x * grd, player.y * grd, game_data.grid, game_data.grid);
        game_data.context.strokeStyle = 'black';
        game_data.context.strokeRect(player.x * grd, player.y * grd, game_data.grid, game_data.grid);
    }

    draw_snek_background(game_data)
    {
        var ctx = game_data.context;
        var cnv = game_data.canvas;

        ctx.fillStyle = 'black';
        ctx.clearRect(0, 0, cnv.width, cnv.height);
        ctx.fillRect(0, 0, cnv.width, cnv.height);

        ctx.strokeStyle = '#562b35';
        ctx.lineWidth = 0.75;

        for (var col = 0; col <= cnv.width / game_data.grid; col++)
        {
            ctx.beginPath();
            ctx.moveTo(col * game_data.grid, 0);
            ctx.lineTo(col * game_data.grid, cnv.height);
            ctx.stroke();
        }

        for (var row = 0; row <= cnv.height / game_data.grid; row++)
        {
            ctx.beginPath();
            ctx.moveTo(0, row * game_data.grid);
            ctx.lineTo(cnv.width, row * game_data.grid);
            ctx.stroke();
        }
    }

    reset_snek_game(game_data)
    {
        game_data.visited_cells = new Set();

        game_data.players.forEach(this.reset_snek_player);

        this.draw_initial_snek_frame.bind(this, game_data)();
    }

    reset_snek_player(player)
    {
        player.x = player.start_x;
        player.y = player.start_y;
        player.dx = player.start_dx;
        player.dy = player.start_dy;
        player.dead = false;
    }

    add_snek_player_listeners(player, up, down, left, right, jump, bool_jump)
    {
        document.addEventListener('keydown', e => this.snek_pong_player_keydown_listener(e, player, up, down, left, right, jump, bool_jump));
    }

    snek_pong_player_keydown_listener(e, player, up, down, left, right, jump, bool_jump)
    {
        if (e.key === up && player.dy !== 1)
        {        
            player.dy = -1;
            player.dx = 0;
        }    
        else if (e.key === down && player.dy !== -1)
        {    
            player.dy = 1;
            player.dx = 0;
        }
        else if (e.key === left && player.dx !== 1)
        {
            player.dx = -1;
            player.dy = 0;
        }
        else if (e.key === right && player.dx !== -1)
        {
            player.dx = 1;
            player.dy = 0;
        }

        if (bool_jump == true && e.key === jump)
        {
            if (player.dx !== 0)
                player.x += (player.dx > 0 ? 5 : -5);
            else
                player.y += (player.dy > 0 ? 5 : -5);
        }
    }

    async handle_game_end(game_data)
    {
       try
        {
           var winners = this.get_winners(game_data);
           var loosers = this.get_loosers(game_data);
           var score_str = game_data.score[0].toString() + " - " + game_data.score[1].toString();

           await this.push_game(game_data.game_type, game_data.tournament, winners[0], winners[1], loosers[0], loosers[1], score_str);
           await this.display_result(game_data.tournament);
           return Promise.resolve();
       }
       catch (err) {return;}
    }

    get_winners(game_data)
    {
        var winning_side = (game_data.score[0] > game_data.score[1] ? 'left' : 'right');
        var winners = game_data.players.filter(player => player.side === winning_side).map(player => player.name);
        if (winners.length === 1)
            winners.push(null);

        return winners;
    }

    get_loosers(game_data)
    {
        var losing_side = (game_data.score[0] > game_data.score[1] ? 'right' : 'left');
        var loosers = game_data.players.filter(player => player.side === losing_side).map(player => player.name);
        if (loosers.length === 1)
            loosers.push(null);

        return loosers;
    }

    async push_game(game_type, tournament, w1, w2, l1, l2, score)
    {
        try
        {
            const response = await authFetch("pong_api/pong_push_game/", {
                    method: "POST",
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({game_type: game_type, tournament: tournament, winner1: w1, winner2: w2, loser1: l1, loser2: l2, score: score})});

            if (!response) {
                this.goToNoAuth("No response from server");
                return;
            }
            if (!response.ok) {
                this.goToError();
                return;
            }
            return await response.json();
        }
        catch(err)
        {
            if (err.message === "No response from server")
                this.goToNoAuth("Session expired. Please log in again.");
            else
                this.goToError();
            throw err;
        }
    }

    async display_result()
    {
        await this.goToResult();
    }

    pause_listener(e, game_data)
    {
        if (e.key === "Enter")
        {
            game_data.paused = !game_data.paused;
        }
    }
}