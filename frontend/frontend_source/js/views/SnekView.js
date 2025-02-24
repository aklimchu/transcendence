
import AbstractView from "./AbstractView.js";

export default class extends AbstractView
{
    constructor(params)
    {
        super(params);
    }

    async goToView()
    {
        try {var json = await this.fetchSessionData();}
        catch (err) {return;}

        var content = `
        
        <br>
            <label for="left-select"> Choose left player: </label>
            <select name="LeftPlayer" id="left-select">
            <option>${json.data["players"]["p1"]["name"]}</option>
            <option>${json.data["players"]["p2"]["name"]}</option>
            <option>${json.data["players"]["p3"]["name"]}</option>
            <option>${json.data["players"]["p4"]["name"]}</option>
            </select>

            <label for="right-select"> Choose right player: </label>
            <select name="RightPlayer" id="right-select">
            <option>${json.data["players"]["p1"]["name"]}</option>
            <option>${json.data["players"]["p2"]["name"]}</option>
            <option>${json.data["players"]["p3"]["name"]}</option>
            <option>${json.data["players"]["p4"]["name"]}</option>
            </select>
        </br>
        <br> <button id="play_snek"> Play 1v1 snake </button> </br>

        `;

        this.setTitle("Snake Game");
        this.unhideNavbar();
        await this.setContent(content);
    }

    async goToResult()
    {
        try {var json = await this.fetchSessionData();}
        catch(err) {return;}

        var game = json.data["games"][0];

        var l1, l2, r1, r2, score_str, score_arr;

        score_str = game["score"];
        score_arr = score_str.split(" - ");

        l1 = (score_arr[0] > score_arr[1]) ? game["winner_1"] : game["loser_1"];
        l2 = (score_arr[0] > score_arr[1]) ? game["winner_2"] : game["loser_2"];
        r1 = (score_arr[0] > score_arr[1]) ? game["loser_1"] : game["winner_1"];
        r2 = (score_arr[0] > score_arr[1]) ? game["loser_2"] : game["winner_2"];

        l1 = (l1 === null) ? "" : l1;
        l2 = (l2 === null) ? "" : l2;
        r1 = (r1 === null) ? "" : r1;
        r2 = (r2 === null) ? "" : r2;

        var content = `
        
        <button id="game_view" sub-view-reference> Go back </button>

        <br> Game completed! </br>
    
        ${l1}   ${l2}   ${score_str}    ${r1}   ${r2}
        `;

        this.setTitle("Game");
        this.unhideNavbar();
        await this.setContent(content);
    }


    /* -------------------------------------------------------------------------------------------------------------------------------------------- */
    /*                                                                                                                                              */
    /*                                   ███████╗███╗   ██╗███████╗██╗  ██╗       ██████╗  █████╗ ███╗   ███╗███████╗                               */
    /*                                   ██╔════╝████╗  ██║██╔════╝██║ ██╔╝      ██╔════╝ ██╔══██╗████╗ ████║██╔════╝                               */
    /*                                   ███████╗██╔██╗ ██║█████╗  █████╔╝       ██║  ███╗███████║██╔████╔██║█████╗                                 */
    /*                                   ╚════██║██║╚██╗██║██╔══╝  ██╔═██╗       ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝                                 */
    /*                                   ███████║██║ ╚████║███████╗██║  ██╗      ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗                               */
    /*                                   ╚══════╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝       ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝                               */                                                           
    /*                                                                                                                                              */
    /* -------------------------------------------------------------- Main game function ---------------------------------------------------------- */
    
    async play_snek(player_left1, player_left2, player_right1, player_right2, tournament)
    {
        var game_data = {};
    
        game_data.player_left1 = player_left1;
        game_data.player_left2 = player_left2;
        game_data.player_right1 = player_right1;
        game_data.player_right2 = player_right2;
        game_data.tournament = tournament;

        // Set canvas
        await this.goToGameView();
    
        game_data.canvas = document.getElementById('pong');
        game_data.context = game_data.canvas.getContext('2d');
        game_data.paused = false;
        game_data.grid = 15;

        game_data.p1 = this.create_player('#24a7a1', game_data.grid * 6, game_data.grid * 6, 0, 1);
        game_data.p2 = this.create_player('#ff9810', game_data.grid * 43, game_data.grid * 27, 0, -1);

        this.getPlayableCells(game_data);
        this.drawBackground(game_data);


        this.draw_player_start_pos(game_data, "p1");
        this.draw_player_start_pos(game_data, "p2");
    
        document.addEventListener('keydown', e => this.pause_listener(e, game_data));
        document.addEventListener('keydown', e => this.player_keydown_listener(e, game_data, 'p1', 'w', 's', 'a', 'd', 'r'));
        document.addEventListener('keydown', e => this.player_keydown_listener(e, game_data, 'p2', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', "l"));

        game_data.timeout = setTimeout(() => {window.requestAnimationFrame(this.snek_loop.bind(this, game_data))}, 100);
    }


    /* ------------------------------------------------------------ Game loop ------------------------------------------------------------ */

    async snek_loop(game_data)
    {
        game_data.canvas.focus();
    
        this.handle_player(game_data, "p1");
        this.handle_player(game_data, "p2");

        if (!game_data.p1.dead && !game_data.p2.dead)
            game_data.timeout = setTimeout(() => {window.requestAnimationFrame(this.snek_loop.bind(this, game_data))}, 100);
        else
            clearTimeout(game_data.timeout);
    }

    handle_player(game_data, player)
    {
        // Check if dead
        if (!game_data.playableCells.has(`${game_data[player].x}x${game_data[player].y}y`) && game_data[player].dead === false)  
            game_data[player].dead = true;

        game_data.playableCells.delete(`${game_data[player].x}x${game_data[player].y}y`);
        
        if (!game_data[player].dead)
        {
            // Draw
            game_data.context.fillStyle = game_data[player].color;
            game_data.context.fillRect(game_data[player].x, game_data[player].y, game_data.grid, game_data.grid);
            game_data.context.strokeStyle = 'black';
            game_data.context.strokeRect(game_data[player].x, game_data[player].y, game_data.grid, game_data.grid);

            // Move
            game_data[player].x += game_data[player].dx * game_data.grid;
            game_data[player].y += game_data[player].dy * game_data.grid;
        };
    }

    /* -------------------------------------------------------------- Game helpers ---------------------------------------------------------- */

    create_player(color, x, y, dx, dy)
    {
        return {color: color, dead: false, x: x, y: y, dx: dx, dy: dy};
    }

    draw_player_start_pos(game_data, player)
    {
        game_data.context.fillStyle = game_data[player].color;
        game_data.context.fillRect(game_data[player].x, game_data[player].y, game_data.grid, game_data.grid);
        game_data.context.strokeStyle = 'black';
        game_data.context.strokeRect(game_data[player].x, game_data[player].y, game_data.grid, game_data.grid);
    };

    getPlayableCells(game_data)
    {
        game_data.playableCells = new Set();
        for (let i = 0; i < game_data.canvas.width / game_data.grid; i++)
        {
            for (let j = 0; j < game_data.canvas.height / game_data.grid; j++)
            {
                game_data.playableCells.add(`${i * game_data.grid}x${j * game_data.grid}y`);
            };
        };
    };

    drawBackground(game_data)
    {
        game_data.context.fillStyle = 'black';
        game_data.context.fillRect(0, 0, game_data.canvas.width, game_data.canvas.height);

        game_data.context.strokeStyle = '#562b35';
        game_data.context.lineWidth = 0.75;

        for (let col = 0; col <= game_data.canvas.width / game_data.grid; col++)
        {
            game_data.context.beginPath();
            game_data.context.moveTo(col * game_data.grid, 0);
            game_data.context.lineTo(col * game_data.grid, game_data.canvas.height);
            game_data.context.stroke();
        }

        for (let row = 0; row <= game_data.canvas.height / game_data.grid; row++)
        {
            game_data.context.beginPath();
            game_data.context.moveTo(0, row * game_data.grid);
            game_data.context.lineTo(game_data.canvas.width, row * game_data.grid);
            game_data.context.stroke();
        }
    };


    /* ------------------------------------------------------------ Key press listeners ------------------------------------------------------------ */

    player_keydown_listener(e, game_data, player, up, down, left, right, jump)
    {
        if (e.key === up && game_data[player].dy !== 1)
        {        
            game_data[player].dy = -1;
            game_data[player].dx = 0;
        }    
        else if (e.key === down && game_data[player].dy !== -1)
        {    
            game_data[player].dy = 1;
            game_data[player].dx = 0;
        }
        else if (e.key === left && game_data[player].dx !== 1)
        {
            game_data[player].dx = -1;
            game_data[player].dy = 0;
        }
        else if (e.key === right && game_data[player].dx !== -1)
        {
            game_data[player].dx = 1;
            game_data[player].dy = 0;
        }

        if (e.key === jump)
        {
            if (game_data[player].dx !== 0)
                game_data[player].x += game_data.grid * (game_data[player].dx > 0 ? 5 : -5);
            else
                game_data[player].y += game_data.grid * (game_data[player].dy > 0 ? 5 : -5);
        }

    }

    async pause_listener(e, game_data)
    {
        if (e.key === "Enter")
        {
            game_data.paused = !game_data.paused;
            if (game_data.paused)
                clearTimeout(game_data.timeout);
            else
                game_data.timeout = setTimeout(() => {window.requestAnimationFrame(this.snek_loop.bind(this, game_data))}, 100);
        }
    }
}