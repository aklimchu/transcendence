import Lobby from "./views/LobbyView.js";
import Game from "./views/GameView.js";
import Tournament from "./views/TournamentView.js";
import Settings from "./views/SettingsView.js";
import Stats from "./views/StatsView.js";
import { login_func, register_func, logout_func, authFetch } from './auth.js';

async function history_and_router(view_id)
{
    history.pushState({view : view_id}, null, null);
    router(null);
};

async function router(path)
{
    const view_obj_arr = [
        {id: "lobby_view", view: Lobby},
        {id: "game_view", view: Game},
        {id: "tournament_view", view: Tournament},
        {id: "settings_view", view: Settings},
        {id: "stats_view", view: Stats}
    ];
    var view_match_map, match, view;
    if (path === null)
        view_match_map = view_obj_arr.map(view_obj => {return {view_obj: view_obj, is_match: history.state !== null && history.state.view === view_obj.id};});
    else
        view_match_map = view_obj_arr.map(view_obj => {return {view_obj: view_obj, is_match: path === view_obj.id};});
    match = view_match_map.find(potential_match => potential_match.is_match);
    if (!match)
        match = {view_obj: view_obj_arr[0], is_match: true};
    view = new match.view_obj.view();
    await view.goToView();
};

window.onpopstate = async function()
{
    router(null);
};

async function view_reference_listener(event)
{
    if (event.target.matches("[view-reference]"))
    {
        event.preventDefault();
        history_and_router(event.target.id);
    }
}

async function sub_view_reference_listener(event)
{
    if (event.target.matches("[sub-view-reference]"))
    {
        event.preventDefault();
        router(event.target.id);
    }
}

async function authentication_listener(event)
{
    var successful;
    if (event.target.id === "login" || event.target.id === "register")
    {
        var user, pwd;
        user = document.getElementById("auth_user").value,
        pwd = document.getElementById("auth_pwd").value;

        if (event.target.id === "login")
            successful = await login_func(user, pwd);
        else
            successful = await register_func(user, pwd);
        
        if (event.target.id === "register" && successful)
            successful = await login_func(user, pwd);

        if (successful)
            await router(null);
    }
    else if (event.target.id === "logout")
    {
        successful = await logout_func();
        if (successful)
            await router(null);
        else
        {
            var view = new Lobby;
            return await view.goToError();
        }
    }
}

async function play_game_listener(event) {
    const button = event.target.closest(".play_game_btn");
    if (!button) return;
    const all_classes = Array.from(button.classList);
    const game_classes = all_classes.filter(cls =>
        ["pong", "snek", "1v1", "2v2", "T0", "T1", "T2", "T3"].includes(cls)
    );
    const game_class = { type_count: 0, mode_count: 0, t_count: 0, unknown: false };
    game_classes.reduce(check_game_class, game_class);
    if (game_class.unknown ||
        game_class.type_count !== 1 ||
        game_class.mode_count !== 1 ||
        game_class.t_count !== 1 ||
        (game_class.mode === '2v2' && game_class.t !== null)) {
        return console.log('❌ Incorrect game classes!');
    }
    const game_view = (game_class.t === null) ? new Game : new Tournament;
    const player_left1 = game_class.mode === "1v1" ? get_player_name(button.dataset.left) : get_player_name('left-select1');
    const player_right1 = game_class.mode === "1v1" ? get_player_name(button.dataset.right) : get_player_name('right-select1');
    const player_left2 = game_class.mode === "1v1" ? null : get_player_name('left-select2');
    const player_right2 = game_class.mode === "1v1" ? null : get_player_name('right-select2');

    // Validation for 1v1 mode
    if (game_class.mode === "1v1") {
        if (player_left1 === player_right1) {
            alert('You cannot play against yourself!');
            return;
        }
    }
    // Validation for 2v2 mode
    else {
        const players = [player_left1, player_left2, player_right1, player_right2].filter(p => p !== null);
        const uniquePlayers = new Set(players);
        if (uniquePlayers.size !== players.length) {
            alert('Each player must be unique in 2v2 mode!');
            return;
        }
    }

    if (game_class.type === 'pong')
        await game_view.play_pong(player_left1, player_left2, player_right1, player_right2, game_class.t);
    else
        await game_view.play_snek(player_left1, player_left2, player_right1, player_right2, game_class.t);
}

async function create_tournament_listener(event) {
    if (event.target.id === "create_pong_tournament" || event.target.id === "create_snek_tournament") {
        let tournamentType = event.target.classList.contains("pong") ? "pong" :
                             event.target.classList.contains("snek") ? "snek" : null;
        console.log("Tournament Type:", tournamentType);
        if (!tournamentType) {
            console.log('Incorrect tournament classes!', event.target.classList);
            return;
        }
        try {
			const response = await authFetch("/pong_api/pong_create_tournament/", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ tournament_type: tournamentType })
			});
			if (!response) {
				console.error("No response from server");
				throw new Error("No response from server");
			}
			if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to create tournament: HTTP ${response.status} - ${errorText}`);
                throw new Error(`Failed to create tournament: ${errorText || "Unknown error"}`);
            }
            const data = await response.json();
            console.log("Tournament created successfully:", data);
            router("tournament_view");
        } catch (err) {
            console.error("Error creating tournament:", err.message);
            document.querySelector("#content").innerHTML = `
                <div class="container my-5">
                    <div class="alert alert-danger text-center fs-5" role="alert" style="background-color: red; color: white; box-shadow: 0px 0px 5px white;">
                        <strong>Error:</strong> ${err.message || "Something went terribly wrong!!"}
                    </div>
                </div>
            `;
        }
    }
}

function content_loaded_listener()
{
    document.body.addEventListener("click", e => {
        console.log("🖱 Click detected:", e.target);
        view_reference_listener(e);
        sub_view_reference_listener(e);
        authentication_listener(e);
        play_game_listener(e);
        create_tournament_listener(e);
    });
    router(null);
}

document.addEventListener("DOMContentLoaded", content_loaded_listener);

function check_game_class(accumulator, item)
{
    if (item === "pong" || item === "snek")
    {
        accumulator.type_count += 1;
        accumulator.type = item;
    }
    else if (item === "1v1" || item === "2v2")
    {
        accumulator.mode_count += 1;
        accumulator.mode = item;
    }
    else if (item === "T0" || item === "T1" || item === "T2"|| item === "T3")
    {
        accumulator.t_count += 1;
        accumulator.t = (item === 'T0' ? null : (item === 'T1' ? 1 : (item === 'T2' ? 2 : 3)));
    }
    else
        accumulator.unknown = true;
    return accumulator;
}

function get_player_name(id) {
    var player_select = document.getElementById(id);
    if (!player_select) {
        console.error(`❌ get_player_name: No element found with id '${id}'`);
        return null;
    }
    return player_select.options[player_select.selectedIndex].text;
}