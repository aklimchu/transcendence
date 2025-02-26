
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

        game_data.fps = 10;
        game_data.delay = 1000 / game_data.fps;
    
        game_data.players = [];
        game_data.tournament = tournament;

        game_data.grid = 15;
        game_data.paused = false;
        game_data.visited_cells = new Set();
        game_data.canvas = document.getElementById('pong');
        game_data.context = game_data.canvas.getContext('2d');
        game_data.cols = game_data.canvas.width / game_data.grid;
        game_data.rows = game_data.canvas.height / game_data.grid;

        this.create_player(game_data, player_left1, 'left', '#24a7a1', 20, 4, 1, 0, 'w', 's', 'a', 'd', 'r');
        this.create_player(game_data, player_right1, 'right', '#ff9810', 20, 55, -1, 0, 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', "l");

        this.draw_initial_frame.bind(this, game_data)();
    
        document.addEventListener('keydown', e => this.pause_listener(e, game_data));

        await new Promise(resolve => {requestAnimationFrame(resolve);}).then(this.snek_loop.bind(this, game_data));
        console.log('---------- END ----------');
    }


    /* ------------------------------------------------------------ Game loop ------------------------------------------------------------ */

    async snek_loop(game_data)
    {

        game_data.canvas.focus();
    
        if (!game_data.paused)
            game_data.players.forEach(this.handle_player.bind(this, game_data));

        if (game_data.players.filter(player => player.dead === true).length === 0)
        {
            await new Promise(r => setTimeout(r, game_data.delay));
            return new Promise(resolve => {requestAnimationFrame(resolve);}).then(this.snek_loop.bind(this, game_data));
        }
        else
        {
            //game_data.players.map(player => {console.log(`${player.name} ${player.dead} x: ${player.x} y: ${player.y}`)});

            var left_dead = game_data.players.filter(player => player.dead === true && player.side === 'left').length;
            var right_dead = game_data.players.filter(player => player.dead === true && player.side === 'right').length;

            //console.log(`left dead: ${left_dead} right dead: ${right_dead}`);

            if (left_dead !== right_dead)
            {
                console.log('push game')
                return Promise.resolve();
            }
            else
            {
                await new Promise(r => setTimeout(r, 400));

                this.reset_game(game_data);

                return new Promise(resolve => {requestAnimationFrame(resolve);}).then(this.snek_loop.bind(this, game_data));
            }
        }
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
        var current_cell = `${player.x}-${player.y}`

        if (player.x < 0 || player.x >= game_data.cols || player.y < 0 || player.y >= game_data.rows)
            return false;
        if (game_data.visited_cells.has(current_cell))
            return false;
        game_data.visited_cells.add(current_cell);
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
            dy: dy,
            start_x: x,
            start_y: y,
            start_dx: dx,
            start_dy: dy
        };

        this.add_player_listeners(player, up, down, left, right, jump);

        game_data.players.push(player);
    }

    draw_initial_frame(game_data)
    {
        this.draw_background(game_data);
        game_data.players.forEach(this.draw_start.bind(null, game_data));
    }

    draw_start(game_data, player)
    {
        var grd = game_data.grid;

        game_data.context.fillStyle = player.color;
        game_data.context.fillRect(player.x * grd, player.y * grd, game_data.grid, game_data.grid);
        game_data.context.strokeStyle = 'black';
        game_data.context.strokeRect(player.x * grd, player.y * grd, game_data.grid, game_data.grid);
    };

    draw_background(game_data)
    {
        var ctx = game_data.context;
        var cnv = game_data.canvas;

        ctx.fillStyle = 'black';
        ctx.clearRect(0, 0, cnv.width, cnv.height);
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

    reset_game(game_data)
    {
        game_data.visited_cells = new Set();

        game_data.players.forEach(this.reset_player);

        this.draw_initial_frame.bind(this, game_data)();
    }

    reset_player(player)
    {
        player.x = player.start_x;
        player.y = player.start_y;
        player.dx = player.start_dx;
        player.dy = player.start_dy;
        player.dead = false;
    }

    /* ------------------------------------------------------------ Key press listeners ------------------------------------------------------------ */

    add_player_listeners(player, up, down, left, right, jump)
    {
        document.addEventListener('keydown', e => this.player_keydown_listener(e, player, up, down, left, right, jump));
    }

    player_keydown_listener(e, player, up, down, left, right, jump)
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