import Lobby from "./views/Lobby_view.js";
import Game from "./views/Game_view.js";
import Tournament from "./views/Tournament_view.js";

import {play_pong} from "./pong.js"


async function history_and_router(view_id)
{
    console.log("History.state before: ", history.state);
    history.pushState({view : view_id}, null, null);
    console.log("History.state after: ", history.state);
    router(null);
};

async function router(path)
{
    const view_obj_arr = [
        {id: "lobby_view", view: Lobby},
        {id: "game_view", view: Game},
        {id: "tournament_view", view: Tournament}
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


//----------------------------------------------------------------------------------------------------------------------------------------


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

async function register_listener(event)
{
    if (event.target.id === "register")
    {
        await register_func
        (
          document.getElementById("register_user").value,
          document.getElementById("register_pwd").value
        );
    }   
}

async function login_listener(event)
{
    if (event.target.id === "login")
    {
        await login_func
        (
          document.getElementById("login_user").value,
          document.getElementById("login_pwd").value
        );
    }   
}

async function play_game_listener(event)
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
        router("tournament_view");
    }
}

function content_loaded_listener()
{
    document.body.addEventListener("click", e => view_reference_listener(e));
    document.body.addEventListener("click", e => sub_view_reference_listener(e));
    document.body.addEventListener("click", e => register_listener(e));
    document.body.addEventListener("click", e => login_listener(e));
    document.body.addEventListener("click", e => play_game_listener(e));
    document.body.addEventListener("click", e => create_tournament_listener(e));
    
    router(null);
}

document.addEventListener("DOMContentLoaded", content_loaded_listener());