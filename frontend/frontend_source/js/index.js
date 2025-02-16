import Register from "./views/Register_view.js";
import Login from "./views/Login_view.js";
import Game from "./views/Game_view.js";
import Lobby from "./views/Lobby_view.js";
import Tournament from "./views/Tournament_view.js";

import {play_pong} from "./pong.js"


async function is_auth()
{
    const response = await fetch("pong_api/pong_auth/", {method: "GET"});
    if (response.ok)
        return true;
    return false;
};

async function go_to_view(view_id)
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
        {id: "register_view", view: Register},
        {id: "login_view", view: Login},
        {id: "game_view", view: Game},
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


//----------------------------------------------------------------------------------------------------------------------------------------


async function sub_router(path)
{
    const view_obj_arr = [
        {id: "register_view", view: Register},
        {id: "login_view", view: Login},
        {id: "game_view", view: Game},
        {id: "lobby_view", view: Lobby},
        {id: "tournament_view", view: Tournament}
    ];

    const view_match_map = view_obj_arr.map(view_obj => {return {view_obj: view_obj, is_match: path !== null && path === view_obj.id};});

    let match = view_match_map.find(potential_match => potential_match.is_match);

    if (!match)
        match = {view_obj: view_obj_arr[0], is_match: true};

    const view = new match.view_obj.view();

    document.querySelector("#app").innerHTML = await view.getHtml();
};


//----------------------------------------------------------------------------------------------------------------------------------------


function view_reference_listener(event)
{
    if (event.target.matches("[view-reference]"))
    {
        event.preventDefault();
        go_to_view(event.target.id);
    }
}

function sub_view_reference_listener(event)
{
    if (event.target.matches("[sub-view-reference]"))
    {
        event.preventDefault();
        sub_router(event.target.id);
    }
}

function play_game_listener(event)
{
    if (event.target.id === "play_game")
    {
        event.preventDefault();
        if (event.target.className === "1v1")
            play_pong(null);
        if (event.target.className === "Tournament1")
            play_pong(1);
        if (event.target.className === "Tournament2")
            play_pong(2);
        if (event.target.className === "Tournament3")
            play_pong(3);
    } 
}

async function create_tournament_listener(event)
{
    if (event.target.id === "create_tournament")
    {
        try
        {
            var response = await fetch("pong_api/pong_create_tournament/", {method: "GET"});
            if (!response.ok)   
                throw new Error("Failed to create tournament");
        }
        catch (err)
        {
            console.error(err.message);
            return document.querySelector("#app").innerHTML = `Something went terribly worng!`;
        }
        sub_router("tournament_view");
    }
}

function add_all_event_listeners()
{
    document.body.addEventListener("click", e => view_reference_listener(e));
    document.body.addEventListener("click", e => sub_view_reference_listener(e));
    document.body.addEventListener("click", e => play_game_listener(e));
    document.body.addEventListener("click", e => create_tournament_listener(e));
}

document.addEventListener("DOMContentLoaded", add_all_event_listeners());