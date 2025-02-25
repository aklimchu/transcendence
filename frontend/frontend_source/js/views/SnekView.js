
import GameView from "./GameView.js";

export default class extends GameView
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

        this.setTitle("Snek Game");
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
        // Set canvas
        await this.goToGameView();

        var game_data = {};
    
        game_data.players = [];
        game_data.tournament = tournament;

        game_data.grid = 15;
        game_data.paused = false;
        game_data.canvas = document.getElementById('pong');
        game_data.context = game_data.canvas.getContext('2d');
        game_data.cols = game_data.canvas.width / game_data.grid;
        game_data.rows = game_data.canvas.height / game_data.grid;

        this.create_player(game_data, player_left1, 'left', '#24a7a1', 20, 10, 1, 0, 'w', 's', 'a', 'd', 'r');
        this.create_player(game_data, player_left2, 'right', '#ff9810', 20, 50, -1, 0, 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', "l");

        this.get_cells(game_data);

        this.draw_background(game_data);

        game_data.players.forEach(this.draw_start.bind(null, game_data));
    
        document.addEventListener('keydown', e => this.pause_listener(e, game_data));

        game_data.timeout = setTimeout(() => {window.requestAnimationFrame(this.snek_loop.bind(this, game_data))}, 100);
    }


    /* ------------------------------------------------------------ Game loop ------------------------------------------------------------ */

    async snek_loop(game_data)
    {
        game_data.canvas.focus();
    
        if (!game_data.paused)
            game_data.players.forEach(this.handle_player.bind(this, game_data));

        if (game_data.players.filter(player => player.dead === true).length === 0)
            game_data.timeout = setTimeout(() => {window.requestAnimationFrame(this.snek_loop.bind(this, game_data))}, 100);
        //else
        //{
        //    //console.log("p1: " + game_data.p1.dead);
        //    //console.log("p2: " + game_data.p2.dead);
//
        //    clearTimeout(game_data.timeout);
//
        //    if (game_data.p1.dead !== game_data.p2.dead)
        //    {
        //        console.log("push game");
        //    }
        //    else
        //    {
        //        // render game restart info on canvas
        //        await new Promise(r => setTimeout(r, 1000));
        //        this.play_snek(game_data.player_left1, game_data.player_left2, game_data.player_right1, game_data.player_right2, game_data.tournament);
        //    }
        //}
    }

    handle_player(game_data, player)
    {
        if (!this.move_to_cell(game_data, player))
            player.dead = true;
        
        if (!player.dead)
        {
            // Draw
            game_data.context.fillStyle = player.color;
            game_data.context.fillRect(player.x * game_data.grid, player.y * game_data.grid, game_data.grid, game_data.grid);
            game_data.context.strokeStyle = 'black';
            game_data.context.strokeRect(player.x * game_data.grid, player.y * game_data.grid, game_data.grid, game_data.grid);

            // Move
            player.x += player.dx;
            player.y += player.dy;
        };
    }

    move_to_cell(game_data, player)
    {
        if (player.x < 0 || player.x >= game_data.cols || player.y < 0 || player.y >= game_data.rows)
            return false;
        if (game_data.cells[player.y][player.x] !== 0)
            return false;

        game_data.cells[player.y][player.x] = 1;

        return true;
    }

    /* -------------------------------------------------------------- Game helpers ---------------------------------------------------------- */

    create_player(game_data, name, side, color, y, x, dx, dy, up, down, left, right, jump)
    {
        var player = 
        {
            name: name,
            color: color,
            side: (side === "left" ? "left" : "right"),
            dead: false,
            x: x,
            y: y,
            dx: dx,
            dy: dy
        };

        this.add_player_listeners(player, game_data, up, down, left, right, jump);

        game_data.players.push(player);
    }

    draw_start(game_data, player)
    {
        var grd = game_data.grid;

        game_data.context.fillStyle = player.color;
        game_data.context.fillRect(player.x * grd, player.y * grd, game_data.grid, game_data.grid);
        game_data.context.strokeStyle = 'black';
        game_data.context.strokeRect(player.x * grd, player.y * grd, game_data.grid, game_data.grid);
    };

    get_cells(game_data)
    {
        game_data.cells = Array(game_data.rows).fill().map(() => Array(game_data.cols).fill(0));
    };

    draw_background(game_data)
    {
        var ctx = game_data.context;
        var cnv = game_data.canvas;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, cnv.width, cnv.height);

        ctx.strokeStyle = '#562b35';
        ctx.lineWidth = 0.75;

        for (var col = 0; col <= cnv.width / game_data.grid; col++)
        {
            ctx.beginPath();
            ctx.moveTo(col * game_data.grid, 0);
            ctx.lineTo(col * game_data.grid, cnv.height);
            ctx.stroke();
        }

        for (var row = 0; row <= cnv.height / game_data.grid; row++)
        {
            ctx.beginPath();
            ctx.moveTo(0, row * game_data.grid);
            ctx.lineTo(cnv.width, row * game_data.grid);
            ctx.stroke();
        }
    };


    /* ------------------------------------------------------------ Key press listeners ------------------------------------------------------------ */

    add_player_listeners(player, game_data, up, down, left, right, jump)
    {
        document.addEventListener('keydown', e => this.player_keydown_listener(e, game_data, player, up, down, left, right, jump));
    }

    player_keydown_listener(e, game_data, player, up, down, left, right, jump)
    {
        if (e.key === up && player.dy !== 1)
        {        
            player.dy = -1;
            player.dx = 0;
        }    
        else if (e.key === down && player.dy !== -1)
        {    
            player.dy = 1;
            player.dx = 0;
        }
        else if (e.key === left && player.dx !== 1)
        {
            player.dx = -1;
            player.dy = 0;
        }
        else if (e.key === right && player.dx !== -1)
        {
            player.dx = 1;
            player.dy = 0;
        }

        if (e.key === jump)
        {
            if (player.dx !== 0)
                player.x += (player.dx > 0 ? 5 : -5);
            else
                player.y += (player.dy > 0 ? 5 : -5);
        }

    }
}