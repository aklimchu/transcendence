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

	push_Settings() {
	    const getValue = (id) => document.getElementById(id)?.value || "";
	    const players = [1, 2, 3, 4].map(player => {
            const name = getValue(`player${player}_name`);
            if (name.trim()) {
                return { player_name: name, position: player };
            }
		}).filter(player => player); // Only include non-empty players

	    const settings = {
	        game_speed: getValue("game_speed"),
	        ball_size: getValue("ball_size"),
	        paddle_size: getValue("paddle_size"),
	        theme: getValue("theme"),
	        font_size: getValue("font_size"),
	        language: getValue("language"),
	        password: getValue("password"),
	        players: players
	    };

	    fetch('/pong_api/pong_settings/', {
	        method: 'POST',
	        headers: {
	            'Content-Type': 'application/json',
	            'X-CSRFToken': getCookie('csrftoken')
	        },
	        body: JSON.stringify(settings)
	    })
	    .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    try {
                        const data = JSON.parse(text);
                        throw new Error(data.error || `HTTP ${response.status} error`);
                    } catch (e) {
                        console.error("Response status:", response.status, "Response text:", text);
                        throw new Error(`Server error (HTTP ${response.status}): ${text.substring(0, 100)}...`);
                    }
                });
            }
            return response.json();
        })
	    .then(data => {
	        if (data.ok) {
	            alert("Settings saved successfully!");
	        } else {
	            alert("Error saving settings: " + data.error);
	        }
	    })
	    .catch(error => {
	        alert("Error saving settings: " + error.message);
	        console.error(error);
	    });

	    function getCookie(name) {
	        let cookieValue = null;
	        if (document.cookie && document.cookie !== '') {
	            const cookies = document.cookie.split(';');
	            for (let i = 0; i < cookies.length; i++) {
	                const cookie = cookies[i].trim();
	                if (cookie.substring(0, name.length + 1) === (name + '=')) {
	                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
	                    break;
	                }
	            }
	        }
	        return cookieValue;
	    }
	}
}