import AbstractView from "./AbstractView.js";
import { authFetch } from "../auth.js";
import { TranslationManager, extractErrorMessage } from "../utils.js";

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

        // Fetch current settings from the server
        let settingsData = {
            game_speed: "normal",
            ball_size: "medium",
            paddle_size: "normal",
            power_jump: "on",
            theme: "light",
            font_size: "medium",
            language: "eng",
            players: Array(4).fill().map((_, index) => ({
                player_name: '',
                avatar: '../css/default-avatar.png',
                position: index + 1
            }))
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
                        return {
                            player_name: player?.player_name || '',
                            avatar: player?.avatar || '../css/default-avatar.png',
                            position: index + 1
                        };
                    })
                };
            } else {
                console.warn("Invalid settings response:", data);
                throw new Error("Invalid settings data received");
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
            await this.goToNoAuth();
            return;
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

        // Apply the current theme and font
        this.applyTheme(settingsData.theme);
        this.applyFontSize(settingsData.font_size);

        // Construct content with player names and translatable elements
        const content = `
            <div class="settings-wrapper">
                <div class="settings-header">
                    <div class="settings-container">
                        <h2 class="head" data-i18n="settings.title_general">General Settings</h2>
                        <form id="settings-form">
                            <div class="form-row">
                                <label for="game_speed" data-i18n="settings.speed">Game Speed</label>
                                <select id="game_speed">
                                    <option value="slow" ${settingsData.game_speed === "slow" ? "selected" : ""} data-i18n="settings.speed_slow">Slow</option>
                                    <option value="normal" ${settingsData.game_speed === "normal" ? "selected" : ""} data-i18n="settings.speed_normal">Normal</option>
                                    <option value="fast" ${settingsData.game_speed === "fast" ? "selected" : ""} data-i18n="settings.speed_fast">Fast</option>
                                </select>
                            </div>
                            <div class="form-row">
                                <label for="paddle_size" data-i18n="settings.paddle_size">Paddle Size</label>
                                <select id="paddle_size">
                                    <option value="short" ${settingsData.paddle_size === "short" ? "selected" : ""} data-i18n="settings.paddle_short">Short</option>
                                    <option value="normal" ${settingsData.paddle_size === "normal" ? "selected" : ""} data-i18n="settings.paddle_normal">Normal</option>
                                    <option value="long" ${settingsData.paddle_size === "long" ? "selected" : ""} data-i18n="settings.paddle_long">Long</option>
                                </select>
                            </div>
                            <div class="form-row">
                                <label for="ball_size" data-i18n="settings.ball_size">Ball Size</label>
                                <select id="ball_size">
                                    <option value="small" ${settingsData.ball_size === "small" ? "selected" : ""} data-i18n="settings.ball_small">Small</option>
                                    <option value="medium" ${settingsData.ball_size === "medium" ? "selected" : ""} data-i18n="settings.ball_medium">Medium</option>
                                    <option value="large" ${settingsData.ball_size === "large" ? "selected" : ""} data-i18n="settings.ball_large">Large</option>
                                </select>
                            </div>
                            <div class="form-row">
                                <label for="power_jump" data-i18n="settings.power_jump">Power Jump (snek)</label>
                                <select id="power_jump">
                                    <option value="on" ${settingsData.power_jump === "on" ? "selected" : ""} data-i18n="settings.power_jump_on">On</option>
                                    <option value="off" ${settingsData.power_jump === "off" ? "selected" : ""} data-i18n="settings.power_jump_off">Off</option>
                                </select>
                            </div>
                            <div class="form-row">
                                <label for="theme" data-i18n="settings.theme">Theme</label>
                                <select id="theme">
                                    <option value="light" ${settingsData.theme === "light" ? "selected" : ""} data-i18n="settings.light">Light</option>
                                    <option value="dark" ${settingsData.theme === "dark" ? "selected" : ""} data-i18n="settings.dark">Dark</option>
                                </select>
                            </div>
                            <div class="form-row">
                                <label for="font_size" data-i18n="settings.font_size">Font Size</label>
                                <select id="font_size">
                                    <option value="small" ${settingsData.font_size === "small" ? "selected" : ""} data-i18n="settings.font_small">Small</option>
                                    <option value="medium" ${settingsData.font_size === "medium" ? "selected" : ""} data-i18n="settings.font_medium">Medium</option>
                                    <option value="large" ${settingsData.font_size === "large" ? "selected" : ""} data-i18n="settings.font_large">Large</option>
                                </select>
                            </div>
                            <div class="form-row">
                                <label for="language" data-i18n="settings.language">Language</label>
                                <select id="language">
                                    <option value="eng" ${settingsData.language === "eng" ? "selected" : ""} data-i18n="settings.lang_eng">English</option>
                                    <option value="fin" ${settingsData.language === "fin" ? "selected" : ""} data-i18n="settings.lang_fin">Finnish</option>
                                    <option value="swd" ${settingsData.language === "swd" ? "selected" : ""} data-i18n="settings.lang_swd">Swedish</option>
                                </select>
                            </div>
                            <div class="form-row">
							    <label for="twofa-select" data-i18n="settings.twofa_label">Two-Factor Authentication</label>
							    <select id="twofa-select">
							        <option value="disabled" ${!twoFAEnabled ? "selected" : ""} data-i18n="settings.twofa_disabled">Disabled</option>
							        <option value="enabled" ${twoFAEnabled ? "selected" : ""} data-i18n="settings.twofa_enabled">Enabled</option>
							    </select>
							</div>
							<div class="form-row" id="twofa-setup-row" style="display:none;">
							    <label></label>
							    <div>
							        <p data-i18n="settings.twofa_qr_instruction">Scan this QR code with your Authenticator app:</p>
							        <img id="twofa-qr" src="" alt="2FA QR Code" data-i18n-alt="settings.twofa_qr_alt" style="max-width:200px;"/>
							        <p data-i18n="settings.twofa_code_instruction">Enter the 6-digit code from your app:</p>
							        <input type="text" id="twofa-code" maxlength="6" class="form-control form-control-sm" style="width:100px;display:inline-block;" />
							        <button id="verify-2fa-btn" class="btn btn-success btn-sm" style="margin-left:0.5em;" data-i18n="settings.twofa_verify">Verify</button>
							        <div id="twofa-verify-msg"></div>
							    </div>
							</div>
                        </form>
                        <button type="button" id="save_settings" class="btn btn-secondary mb-4" data-i18n="settings.save_settings">Save Settings</button>
                    </div>
                    <div class="player-settings-container">
                        <h2 class="head" data-i18n="settings.title_player">Player Settings</h2>
                        <div class="player-settings">
                            ${settingsData.players.map((player, index) => `
                                <div class="player-box player${index + 1}">
                                    <div class="player-name" data-name="${player.player_name || `Player ${index + 1}`}">${player.player_name || `Player ${index + 1}`}</div>
                                    <div class="player-avatar">
                                        <img src="${player.avatar || '../css/default-avatar.png'}" alt="Avatar" class="avatar-image" />
                                    </div>
                                    <div class="player-config player${index + 1}-config">
                                        <label for="player${index + 1}_name" data-i18n="settings.player_name">Name</label>
                                        <input type="text" id="player${index + 1}_name" data-i18n-placeholder="settings.player_placeholder" placeholder="Enter name" value="${player.player_name || ''}" />
                                    </div>
                                    <div class="avatar-container">
                                        <input type="file" id="player${index + 1}_avatar" accept="image/*" class="avatar-upload" />
                                        <label for="player${index + 1}_avatar" class="avatar-upload-label" data-i18n="settings.upload_avatar">Upload Avatar</label>
                                        <span id="player${index + 1}_avatar_error" class="error-message" style="display: none; font-size: var(--base-font-size);"></span>
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
		this.unhideNavbar();
		await this.setContent(container.innerHTML);

        // Add validation for avatar uploads with success message and hover behavior
        settingsData.players.forEach((_, index) => {
            const playerId = index + 1;
            const fileInput = document.getElementById(`player${playerId}_avatar`);
            const errorSpan = document.getElementById(`player${playerId}_avatar_error`);
            const playerBox = document.querySelector(`.player${playerId}`);

            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                    if (!validTypes.includes(file.type)) {
                        errorSpan.textContent = 'Please upload a valid image file.';
                        errorSpan.style.color = 'red';
                        errorSpan.style.display = 'block';
                        fileInput.value = '';
                        setTimeout(() => {
                            errorSpan.style.display = 'none';
                        }, 1000);
                        return;
                    }
                    const maxSize = 2 * 1024 * 1024;
                    if (file.size > maxSize) {
                        errorSpan.textContent = 'File size must be less than 2MB.';
                        errorSpan.style.color = 'red';
                        errorSpan.style.display = 'block';
                        fileInput.value = '';
                        setTimeout(() => {
                            errorSpan.style.display = 'none';
                        }, 1000);
                        return;
                    }
                    // Validation successful
                    errorSpan.textContent = 'Image file is valid';
                    errorSpan.style.color = 'green';
                    errorSpan.style.display = 'block';
                } else {
                    errorSpan.style.display = 'none';
                }
            });

            playerBox.addEventListener('mouseover', () => {
                if (fileInput.files.length > 0) {
                    errorSpan.style.display = 'none';
                }
            });

            playerBox.addEventListener('mouseout', () => {
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                    if (validTypes.includes(file.type) && file.size <= 2 * 1024 * 1024) {
                        errorSpan.textContent = 'Image file is valid';
                        errorSpan.style.color = 'green';
                    }
                    errorSpan.style.display = 'block';
                }
            });
        });

        // Apply translations
        const translations = await this.translationManager.initLanguage(settingsData.language, [
            'settings.title',
            'settings.title_general',
            'settings.title_player',
            'settings.speed',
            'settings.speed_slow',
            'settings.speed_normal',
            'settings.speed_fast',
            'settings.ball_size',
            'settings.ball_small',
            'settings.ball_medium',
            'settings.ball_large',
            'settings.paddle_size',
            'settings.paddle_short',
            'settings.paddle_normal',
            'settings.paddle_long',
            'settings.power_jump',
            'settings.power_jump_on',
            'settings.power_jump_off',
            'settings.theme',
            'settings.light',
            'settings.dark',
            'settings.font_size',
            'settings.font_small',
            'settings.font_medium',
            'settings.font_large',
            'settings.language',
            'settings.lang_eng',
            'settings.lang_fin',
            'settings.lang_swd',
            'settings.password',
            'settings.password_placeholder',
            'settings.save_settings',
            'settings.player_name',
            'settings.player_placeholder',
            'settings.alert_saved',
            'settings.alert_error',
			'settings.twofa_label',
    		'settings.twofa_disabled',
    		'settings.twofa_enabled',
    		'settings.twofa_qr_instruction',
    		'settings.twofa_code_instruction',
    		'settings.twofa_verify',
    		'settings.twofa_qr_alt'
        ]);

        // Set translated page title
        const title = translations.settings?.title || 'Settings';
        this.setTitle(title);

        document.getElementById("save_settings").addEventListener("click", this.push_Settings.bind(this, translations));

		const twofaSelect = document.getElementById("twofa-select");
		const twofaSetupRow = document.getElementById("twofa-setup-row");
		if (twofaSetupRow) {
			twofaSetupRow.style.display = "none";
		}

		twofaSelect.addEventListener("change", async function () {
			if (this.value === "enabled" && !twoFAEnabled) {
				twofaSetupRow.style.display = "flex";
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

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    applyFontSize(fontSize) {
        document.documentElement.setAttribute('data-font-size', fontSize);
        localStorage.setItem('font-size', fontSize);
    }

    push_Settings(translations) {
        const formData = new FormData();
        const getValue = (id) => document.getElementById(id)?.value || "";

        // Add non-file settings
        formData.append("game_speed", getValue("game_speed"));
        formData.append("ball_size", getValue("ball_size"));
        formData.append("paddle_size", getValue("paddle_size"));
        formData.append("power_jump", getValue("power_jump"));
        formData.append("theme", getValue("theme"));
        formData.append("font_size", getValue("font_size"));
        formData.append("language", getValue("language"));
        formData.append("password", getValue("password"));

        // Handle player data and avatar uploads
        const players = [1, 2, 3, 4].map(playerId => {
            const name = getValue(`player${playerId}_name`);
            const avatarInput = document.getElementById(`player${playerId}_avatar`);
            const avatarFile = avatarInput?.files[0];

            if (name.trim() || avatarFile) {
                formData.append(`players[${playerId - 1}][player_name]`, name);
                formData.append(`players[${playerId - 1}][position]`, playerId);
                if (avatarFile) {
                    formData.append(`players[${playerId - 1}][avatar]`, avatarFile);
                }
                return { player_name: name, position: playerId, avatar: avatarFile ? URL.createObjectURL(avatarFile) : null };
            }
        }).filter(player => player);

        // Append players array length for server-side processing
        formData.append("players_length", players.length);

        authFetch('/pong_api/pong_settings/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
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
                alert(translations.settings?.alert_saved || "Settings saved successfully!");
                setTimeout(() => {
                    this.goToView();
                }, 1000);
            } else {
                alert(`${translations.settings?.alert_error || "Error saving settings"}: ${data.error}`);
            }
        })
        .catch(error => {
            alert(`${translations.settings?.alert_error || "Error saving settings"}: ${error.message}`);
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