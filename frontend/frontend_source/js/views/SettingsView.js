import AbstractView from "./AbstractView.js";
import { authFetch } from "../auth.js";
import { TranslationManager, extractErrorMessage } from "../utils.js";

export default class extends AbstractView {
    constructor(params) {
        super(params);
        this.translationManager = new TranslationManager(); // Initialize TranslationManager
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

        // Fetch current settings from the server
        let settingsData = {
            game_speed: "normal",
            ball_size: "medium",
            paddle_size: "normal",
            power_jump: "on",
            theme: "light",
            font_size: "medium",
            language: "eng",
            players: Array(4).fill().map((_, index) => ({ player_name: '', avatar: '../../css/default-avatar.png', position: index + 1 }))        };

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
            // Fall back to defaults defined above
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
                                <label for="password" data-i18n="settings.password">Change Password</label>
                                <input type="password" id="password" data-i18n-placeholder="settings.password_placeholder" placeholder="Enter new password" />
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
                                        <img src="${player.avatar || '../../css/default-avatar.png'}" alt="Avatar" class="avatar-image" />
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

        this.unhideNavbar();
        await this.setContent(content);

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
                        }, 1000); // 1-second delay
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
                        }, 1000); // 1-second delay
                        return;
                    }
                    // Validation successful
                    errorSpan.textContent = 'Image file is valid';
                    errorSpan.style.color = 'green';
                    errorSpan.style.display = 'block';
                } else {
                    // No file selected, hide the message
                    errorSpan.style.display = 'none';
                }
            });
        
            // Hide message on hover, show again on mouseout if file is selected
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
                    } /* else if (!validTypes.includes(file.type)) {
                        errorSpan.textContent = 'Please upload a valid image file.';
                        errorSpan.style.color = 'red';
                    } else {
                        errorSpan.textContent = 'File size must be less than 2MB.';
                        errorSpan.style.color = 'red';
                    } */
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
            'settings.alert_error'
        ]);

        // Set translated page title
        const title = translations.settings?.title || 'Settings';
        this.setTitle(title);

        document.getElementById("save_settings").addEventListener("click", this.push_Settings.bind(this, translations));
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme); // Optional: store locally for quick access
    }

    applyFontSize(fontSize) {
        document.documentElement.setAttribute('data-font-size', fontSize);
        localStorage.setItem('font-size', fontSize); // Optional: store locally for quick access
    }

    push_Settings(translations) {
        const getValue = (id) => document.getElementById(id)?.value || "";
        const players = [1, 2, 3, 4].map(player => {
            const name = getValue(`player${player}_name`);
            const avatarInput = document.getElementById(`avatar${player}`);
            const avatar = avatarInput?.files[0] ? URL.createObjectURL(avatarInput.files[0]) : getValue(`player${player}_avatar`) || '../../css/default-avatar.png';
            if (name.trim()) {
                return { player_name: name, avatar: avatar, position: player };
            }
        }).filter(player => player);

        const settings = {
            game_speed: getValue("game_speed"),
            ball_size: getValue("ball_size"),
            paddle_size: getValue("paddle_size"),
            power_jump: getValue("power_jump"),
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
                'X-CSRFToken': getCookie('csrftoken')
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
                alert(translations.settings?.alert_saved || "Settings saved successfully!");
                setTimeout(() => {
                    this.goToView();
                }, 1000); // 1-second delay
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