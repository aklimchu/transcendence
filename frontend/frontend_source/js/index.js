import Lobby from "./views/LobbyView.js";
import Game from "./views/GameView.js";
import Tournament from "./views/TournamentView.js";


async function history_and_router(view_id)
{
    //console.log("History.state before: ", history.state);
    history.pushState({view : view_id}, null, null);
    //console.log("History.state after: ", history.state);
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


//---------------------------------------------------------- Listeners ------------------------------------------------------------------------------


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
    if (event.target.id === "login" || event.target.id === "register")
    {
        var user, pwd, successful;

        user = document.getElementById("auth_user").value,
        pwd = document.getElementById("auth_pwd").value;

        // Handle original request
        if (event.target.id === "login")
            successful = await login_func(user, pwd);
        else
            successful = await register_func(user, pwd);
        
        // On successful register try login
        if (event.target.id === "register" && successful)
            successful = await login_func(user, pwd);

        if (successful)
            router(null);
    }   
}

async function play_game_listener(event)
{
    if (event.target.id === "play_game")
    {
        event.preventDefault();
        var game_view;
        
        if (event.target.className === "1v1")
        {
            game_view = new Game;

            game_view.play_pong(null);
        }
        else
        {
            game_view = new Tournament;

            if (event.target.className === "Tournament1")
                game_view.play_pong(1);
            if (event.target.className === "Tournament2")
                game_view.play_pong(2);
            if (event.target.className === "Tournament3")
                game_view.play_pong(3);
        }
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
    document.body.addEventListener("click", e => authentication_listener(e));
    document.body.addEventListener("click", e => play_game_listener(e));
    document.body.addEventListener("click", e => create_tournament_listener(e));
    
    router(null);
}

document.addEventListener("DOMContentLoaded", content_loaded_listener());