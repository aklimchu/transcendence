import Register from "./views/Register_view.js";
import Login from "./views/Login_view.js";
import Game from "./views/Game_view.js";

const go_to_view = view_id => {
    console.log("History.state before: ", history.state);
    history.pushState({view : view_id}, null, null);
    console.log("History.state after: ", history.state);
    router();
};

const router = async () => {
    const view_obj_arr = [
        {id: "register_view", view: Register },
        {id: "login_view", view: Login },
        {id: "game_view", view: Game }
    ];

    const view_match_map = view_obj_arr.map(view_obj => {return {view_obj: view_obj, is_match: history.state !== null && history.state.view === view_obj.id};});

    let match = view_match_map.find(potential_match => potential_match.is_match);

    if (!match)
        match = {view_obj: view_obj_arr[0], is_match: true};

    const view = new match.view_obj.view();

    document.querySelector("#app").innerHTML = await view.getHtml();
};

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[view-reference]")) {
            e.preventDefault();
            go_to_view(e.target.id);
        }
    });

    router();
});