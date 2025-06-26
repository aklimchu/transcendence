import AbstractView from "./AbstractView.js";
import { authFetch } from "../auth.js";

export default class extends AbstractView {
	constructor(params) {
		super(params);
	}
	
	extractErrorMessage(text, status) {
		try {
			const cleanedText = text.trim().replace(/^\uFEFF/, '');
			const data = JSON.parse(cleanedText);
			return data.error || `HTTP ${status} error`;
		} catch (e) {
			console.error("Parse error:", e, "Response status:", status, "Response text:", text);
			const errorMatch = text.match(/"error"\s*:\s*"([^"]+)"/i);
			console.log("Error match: ",  errorMatch);
			if (errorMatch && errorMatch[1]) {
				return errorMatch[1];
			}
			const plainText = text.trim().substring(0, 100);
			if (plainText) {
				return `Server error (HTTP ${status}): ${plainText}${text.length > 100 ? '...' : ''}`;
			}
			return `Server error (HTTP ${status}): No error message available`;
		}
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
		
		// Fetch current settings from the server
		let settingsData = {
			game_speed: "normal",
			ball_size: "medium",
			paddle_size: "normal",
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
				throw new Error("Invalid settings data received");
			}
		} catch (error) {
			console.error("Failed to load settings:", error);
			alert("Error loading settings: " + error.message);
			// Fall back to defaults defined above
		}

		let twoFAEnabled = false;
		try {
			const resp = await authFetch("/pong_api/2fa/status/");
			if (resp.ok) {
				const data = await resp.json();
				twoFAEnabled = data["2fa_enabled"];
			}
		} catch (e) {
			console.warn("Could not fetch 2FA status:", e);
		}

		// Construct content with player names
		const content = `
			<div class="settings-wrapper">
				<div class="settings-header">
					<div class="settings-container">
						<h2 class="head">General Settings</h2>
						<form id="settings-form">
							<div class="form-row">
								<label for="game_speed">Game Speed</label>
								<select id="game_speed">
									<option value="slow" ${settingsData.game_speed === "slow" ? "selected" : ""}>Slow</option>
									<option value="normal" ${settingsData.game_speed === "normal" ? "selected" : ""}>Normal</option>
									<option value="fast" ${settingsData.game_speed === "fast" ? "selected" : ""}>Fast</option>
								</select>
							</div>
							<div class="form-row">
								<label for="ball_size">Ball Size</label>
								<select id="ball_size">
									<option value="small" ${settingsData.ball_size === "small" ? "selected" : ""}>Small</option>
									<option value="medium" ${settingsData.ball_size === "medium" ? "selected" : ""}>Medium</option>
									<option value="large" ${settingsData.ball_size === "large" ? "selected" : ""}>Large</option>
								</select>
							</div>
							<div class="form-row">
								<label for="paddle_size">Paddle Size</label>
								<select id="paddle_size">
									<option value="short" ${settingsData.paddle_size === "short" ? "selected" : ""}>Short</option>
									<option value="normal" ${settingsData.paddle_size === "normal" ? "selected" : ""}>Normal</option>
									<option value="long" ${settingsData.paddle_size === "long" ? "selected" : ""}>Long</option>
								</select>
							</div>
							<div class="form-row">
								<label for="theme">Theme</label>
								<select id="theme">
									<option value="light" ${settingsData.theme === "light" ? "selected" : ""}>Light</option>
									<option value="dark" ${settingsData.theme === "dark" ? "selected" : ""}>Dark</option>
								</select>
							</div>
							<div class="form-row">
								<label for="font_size">Font Size</label>
								<select id="font_size">
									<option value="small" ${settingsData.font_size === "small" ? "selected" : ""}>Small</option>
									<option value="medium" ${settingsData.font_size === "medium" ? "selected" : ""}>Medium</option>
									<option value="large" ${settingsData.font_size === "large" ? "selected" : ""}>Large</option>
								</select>
							</div>
							<div class="form-row">
								<label for="language">Language</label>
								<select id="language">
									<option value="eng" ${settingsData.language === "eng" ? "selected" : ""}>English</option>
									<option value="fin" ${settingsData.language === "fin" ? "selected" : ""}>Finnish</option>
									<option value="swd" ${settingsData.language === "swd" ? "selected" : ""}>Swedish</option>
								</select>
							</div>
							<div class="form-row">
								<label for="password">Change Password</label>
								<input type="password" id="password" placeholder="Enter new password" />
							</div>
							<div class="form-row">
								<label for="twofa-select">Two-Factor Authentication</label>
								<select id="twofa-select">
									<option value="disabled" ${!twoFAEnabled ? "selected" : ""}>Disabled</option>
									<option value="enabled" ${twoFAEnabled ? "selected" : ""}>Enabled</option>
								</select>
							</div>
							<div class="form-row" id="twofa-setup-row" style="display:none;">
								<label></label>
								<div>
									<p>Scan this QR code with your Authenticator app:</p>
									<img id="twofa-qr" src="" alt="2FA QR Code" style="max-width:200px;"/>
									<p>Enter the 6-digit code from your app:</p>
									<input type="text" id="twofa-code" maxlength="6" class="form-control form-control-sm" style="width:100px;display:inline-block;" />
									<button id="verify-2fa-btn" class="btn btn-success btn-sm" style="margin-left:0.5em;">Verify</button>
									<div id="twofa-verify-msg"></div>
								</div>
							</div>
						</form>
						<button type="button" id="save_settings" class="btn btn-secondary mb-4">
							Save Settings
						</button>
					</div>
					<div class="player-settings-container">
						<h2 class="head">Player Settings</h2>
						<div class="player-settings">
							${settingsData.players.map((player, index) => `
								<div class="player-box player${index + 1}">
									<h3>${player.player_name || `Player ${index + 1}`}</h3>
									<div class="player-config player${index + 1}-config">
										<label for="player${index + 1}_name">Name</label>
										<input type="text" id="player${index + 1}_name" placeholder="Enter name" value="${player.player_name || ''}" />
									</div>
								</div>
							`).join('')}
						</div>
					</div>
				</div>
			</div>
		`;

		const container = document.createElement("div");
		container.innerHTML = content;
		this.setTitle("Settings");
		this.unhideNavbar();
		await this.setContent(container.innerHTML);

		document.getElementById("save_settings").addEventListener("click", this.push_Settings.bind(this));

		const twofaSelect = document.getElementById("twofa-select");
		const twofaSetupRow = document.getElementById("twofa-setup-row");

		twofaSelect.addEventListener("change", async function () {
			if (this.value === "enabled" && !twoFAEnabled) {
				const resp = await authFetch("/pong_api/2fa/setup/", { method: "POST" });
				if (resp.ok) {
					const data = await resp.json();
					twofaSetupRow.style.display = "flex";
					document.getElementById("twofa-qr").src = "data:image/png;base64," + data.qr_code;

					const verifyBtn = document.getElementById("verify-2fa-btn");
					if (verifyBtn) {
						verifyBtn.onclick = async (event) => {
							event.preventDefault();
							const code = document.getElementById("twofa-code").value;
							const resp = await authFetch("/pong_api/2fa/verify/", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ token: code })
							});
							if (resp.ok) {
								alert("2FA enabled!");
								window.location.reload();
							} else {
								const data = await resp.json();
								alert(data.error || "Invalid code. Try again.");
								window.location.reload();
							}
						};
					}
				}
			} else if (this.value === "disabled" && twoFAEnabled) {
				if (!confirm("Are you sure you want to disable 2FA?")) {
					this.value = "enabled";
					return;
				}
				const resp = await authFetch("/pong_api/2fa/disable/", { method: "POST" });
				if (resp.ok) {
					alert("2FA disabled!");
					window.location.reload();
				} else {
					alert("Failed to disable 2FA.");
					this.value = "enabled";
				}
			}
		});
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

		authFetch('/pong_api/pong_settings/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(settings)
		})
		.then(response => {
			if (!response.ok) {
				return response.text().then(text => {
						throw new Error(extractErrorMessage(text, response.status));
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

		function extractErrorMessage(text, status) {
			try {
				const cleanedText = text.trim().replace(/^\uFEFF/, '');
				const data = JSON.parse(cleanedText);
				return data.error || `HTTP ${status} error`;
			} catch (e) {
				console.error("Parse error:", e, "Response status:", status, "Response text:", text);
				const errorMatch = text.match(/"error"\s*:\s*"([^"]+)"/i);
				console.log("Error match: ",  errorMatch);
				if (errorMatch && errorMatch[1]) {
					return errorMatch[1];
				}
				const plainText = text.trim().substring(0, 100);
				if (plainText) {
					return `Server error (HTTP ${status}): ${plainText}${text.length > 100 ? '...' : ''}`;
				}
				return `Server error (HTTP ${status}): No error message available`;
			}
		}
	}
}