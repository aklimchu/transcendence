import { authFetch } from './auth.js';

export async function resetSettingsToDefault()
    {
        try {
            // Fetch current settings
            console.log("Fetching current settings from /pong_api/pong_settings/");
            const getResponse = await authFetch("/pong_api/pong_settings/", {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            console.log("GET Response status:", getResponse.status);
            const getResponseText = await getResponse.text();
            console.log("GET Response text:", getResponseText);
            if (!getResponse.ok) {
                throw new Error(this.extractErrorMessage(getResponseText, getResponse.status));
            }
            const getData = JSON.parse(getResponseText);
            console.log("Current settings data:", getData);
            if (!getData.ok || !getData.settings || typeof getData.settings !== "object") {
                throw new Error("Invalid settings data received");
            }

            // Update only the specified settings
            const updatedSettings = {
                ...getData.settings,
                game_speed: "normal",
                paddle_size: "normal",
                ball_size: "medium",
                power_jump: "on"
            };

            // Send updated settings to the server
            console.log("Sending updated settings to /pong_api/pong_settings/");
            const postResponse = await authFetch("/pong_api/pong_settings/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedSettings)
            });
            console.log("POST Response status:", postResponse.status);
            const postResponseText = await postResponse.text();
            console.log("POST Response text:", postResponseText);
            if (!postResponse.ok) {
                throw new Error(this.extractErrorMessage(postResponseText, postResponse.status));
            }
            const postData = JSON.parse(postResponseText);
            console.log("Settings update response:", postData);
            if (postData.ok) {
                alert("Settings have been reset to default!");
            } else {
                throw new Error("Failed to reset settings");
            }
        } catch (error) {
            console.error("Failed to reset settings:", error);
            alert("Error resetting settings: " + error.message);
        }
    }