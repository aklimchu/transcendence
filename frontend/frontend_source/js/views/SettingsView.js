import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor(params) {
        super(params);
    }

    async goToView() {
        var content = `
            <div class="settings-wrapper">
                <div class="settings-header">
                    <div class="settings-container">
                        <h2 class="head">General Settings</h2>
                        <form id="settings-form">
                        <div class="form-row">
                            <label for="game_speed">Game Speed</label>
                            <select id="game_speed">
                            <option value="slow">Slow</option>
                            <option value="normal" selected>Normal</option>
                            <option value="fast">Fast</option>
                            </select>
                        </div>

                        <div class="form-row">
                            <label for="ball_size">Ball Size</label>
                            <select id="ball_size">
                            <option value="small">Small</option>
                            <option value="medium" selected>Medium</option>
                            <option value="large">Large</option>
                            </select>
                        </div>

                        <div class="form-row">
                            <label for="paddle_size">Paddle Size</label>
                            <select id="paddle_size">
                            <option value="short">Short</option>
                            <option value="normal" selected>Normal</option>
                            <option value="long">Long</option>
                            </select>
                        </div>

                        <div class="form-row">
                            <label for="theme">Theme</label>
                            <select id="theme">
                            <option value="light" selected>Light</option>
                            <option value="dark">Dark</option>
                            </select>
                        </div>

                        <div class="form-row">
                            <label for="font_size">Font Size</label>
                            <select id="font_size">
                            <option value="small">Small</option>
                            <option value="medium" selected>Medium</option>
                            <option value="large">Large</option>
                            </select>
                        </div>

                        <div class="form-row">
                            <label for="language">Language</label>
                            <select id="language">
                            <option value="eng" selected>English</option>
                            <option value="fin">Finnish</option>
                            <option value="swd">Swedish</option>
                            </select>
                        </div>

                        <div class="form-row">
                            <label for="password">Change Password</label>
                            <input type="password" id="password" placeholder="Enter new password" />
                        </div>
                        </form>
                        <button type="button" id="save_settings" class="btn btn-secondary mb-4">
                            Save Settings
                        </button>
                    </div>

                    <div class="player-settings-container">
                        <h2 class="head">Player Settings</h2>
                        <div class="player-settings">
                        ${[1, 2, 3, 4].map(player => `
                            <div class="player-box player${player}">
                            <h3>Player ${player}</h3>
                            <div class="player-config player${player}-config">
                                <label for="player${player}_name">Name</label>
                                <input type="text" id="player${player}_name" placeholder="Enter name" />
                            </div>
                            </div>
                        `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setTitle("Settings");
        this.unhideNavbar();
        await this.setContent(content);

        document.getElementById("save_settings").addEventListener("click", this.push_Settings);
    }

    // save changes to backend, not sure how to do this lucas C:
    push_Settings() {
        const getValue = (id) => document.getElementById(id)?.value || "";
        const getFileName = (id) => document.getElementById(id)?.files?.[0]?.name || null;
    
        const settings = {
            gameSpeed: getValue("game_speed"),
            ballSize: getValue("ball_size"),
            paddleSize: getValue("paddle_size"),
            theme: getValue("theme"),
            players: [1, 2, 3, 4].map(player => ({
                name: getValue(`player${player}_name`), // not sure where they are stored
            }))
        };
    
        // save settings to database, backend stuff
        alert("Settings saved!");
    }
}

