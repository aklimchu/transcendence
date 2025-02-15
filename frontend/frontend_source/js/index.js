import Register from "./views/Register_view.js";
import Login from "./views/Login_view.js";
import Game from "./views/Game_view.js";
import Lobby from "./views/Lobby_view.js";
import Tournament from "./views/Tournament_view.js";

async function is_auth()
{
    const response = await fetch("pong_api/pong_auth/", {method: "GET"});
    if (response.ok)
        return true;
    return false;
};

export async function go_to_view(view_id)
{
    let pong_auth = await is_auth();
    if (!pong_auth && view_id !== "login_view" && view_id !== "register_view")
        view_id = "login_view"

    console.log("History.state before: ", history.state);
    history.pushState({view : view_id}, null, null);
    console.log("History.state after: ", history.state);
    router(pong_auth);
};

async function router(pong_auth)
{
    const view_obj_arr = [
        {id: "register_view", view: Register },
        {id: "login_view", view: Login },
        {id: "game_view", view: Game },
        {id: "lobby_view", view: Lobby},
        {id: "tournament_view", view: Tournament}
    ];

    const view_match_map = view_obj_arr.map(view_obj => {return {view_obj: view_obj, is_match: history.state !== null && history.state.view === view_obj.id};});

    let match = view_match_map.find(potential_match => potential_match.is_match);

    if (!match)
        match = {view_obj: view_obj_arr[0], is_match: true};

    const view = new match.view_obj.view();

    document.querySelector("#app").innerHTML = await view.getHtml(pong_auth);
};

window.onpopstate = async function()
{
    let pong_auth = await is_auth();
    router(pong_auth);
};


document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[view-reference]"))
        {
            e.preventDefault();
            go_to_view(e.target.id);
        }
    });

    router();
});