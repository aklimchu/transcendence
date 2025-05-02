 
import AbstractView from "./AbstractView.js";
import { getCookie } from '../auth.js';

export default class extends AbstractView
{
    constructor(params)
    {
        super(params);
    }

    async goToView() {
        try { var json = await this.fetchSessionData(); }
        catch (err) { return; }
    
        var content = `
        <div class="container-fluid py-4">
                <div class="row teal-container">
                    <div class="hover-overlay">1v1 Mode</div>
                    <div class="col teal-box d-flex flex-column justify-content-center align-items-center">
                        <div class="mb-3">
                            <label for="left-select">Pick left player:</label>
                            <select name="LeftPlayer" id="left-select" class="form-select">
                                <option>${json.data["players"]["p1"]["name"]}</option>
                                <option>${json.data["players"]["p2"]["name"]}</option>
                                <option>${json.data["players"]["p3"]["name"]}</option>
                                <option>${json.data["players"]["p4"]["name"]}</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="right-select">Pick right player:</label>
                            <select name="RightPlayer" id="right-select" class="form-select">
                                <option>${json.data["players"]["p1"]["name"]}</option>
                                <option>${json.data["players"]["p2"]["name"]}</option>
                                <option>${json.data["players"]["p3"]["name"]}</option>
                                <option>${json.data["players"]["p4"]["name"]}</option>
                            </select>
                        </div>
                        <div class="d-flex gap-3">
                            <button type="button" class="btn btn-warning play_game_btn pong 1v1 T0" data-left="left-select" data-right="right-select">Play Pong</button>
                            <button type="button" class="btn btn-secondary play_game_btn snek 1v1 T0" data-left="left-select" data-right="right-select">Play Snek</button>
                        </div>
                    </div>
                </div>
    
                <div class="row teal-container">
                    <div class="hover-overlay">2v2 Mode</div>
                    <div class="col teal-box d-flex flex-column justify-content-center align-items-center">
                        <div class="row mb-2">
                            <div class="col">
                                <label for="left-select1">Pick left player 1:</label>
                                <select name="LeftPlayer1" id="left-select1" class="form-select">
                                    <option>${json.data["players"]["p1"]["name"]}</option>
                                    <option>${json.data["players"]["p2"]["name"]}</option>
                                    <option>${json.data["players"]["p3"]["name"]}</option>
                                    <option>${json.data["players"]["p4"]["name"]}</option>
                                </select>
                            </div>
                            <div class="col">
                                <label for="right-select1">Pick right player 1:</label>
                                <select name="RightPlayer1" id="right-select1" class="form-select">
                                    <option>${json.data["players"]["p1"]["name"]}</option>
                                    <option>${json.data["players"]["p2"]["name"]}</option>
                                    <option>${json.data["players"]["p3"]["name"]}</option>
                                    <option>${json.data["players"]["p4"]["name"]}</option>
                                </select>
                            </div>
                        </div>
                        <div class="row mb-4">
                            <div class="col">
                                <label for="left-select2">Pick left player 2:</label>
                                <select name="LeftPlayer2" id="left-select2" class="form-select">
                                    <option>${json.data["players"]["p1"]["name"]}</option>
                                    <option>${json.data["players"]["p2"]["name"]}</option>
                                    <option>${json.data["players"]["p3"]["name"]}</option>
                                    <option>${json.data["players"]["p4"]["name"]}</option>
                                </select>
                            </div>
                            <div class="col">
                                <label for="right-select2">Pick right player 2:</label>
                                <select name="RightPlayer2" id="right-select2" class="form-select">
                                    <option>${json.data["players"]["p1"]["name"]}</option>
                                    <option>${json.data["players"]["p2"]["name"]}</option>
                                    <option>${json.data["players"]["p3"]["name"]}</option>
                                    <option>${json.data["players"]["p4"]["name"]}</option>
                                </select>
                            </div>
                        </div>
                        <div class="d-flex gap-3">
                            <button type="button" class="btn btn-warning play_game_btn pong 2v2 T0">Play Pong</button>
                            <button type="button" class="btn btn-secondary play_game_btn snek 2v2 T0">Play Snek</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.setTitle("Game");
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
            <div class="container my-6">
                <button type="button" id="game_view" class="go-back-btn btn btn-secondary mb-4" sub-view-reference>
                    Go back
                </button>
                <h3 class="game-status-card p-3 text-center mb-4">Game Completed!</h3>
                <div class="game-card p-4 fs-5">
                    <div class="game-card-body">
                        <div class="row text-center">
                            <div class="col">
                                <h5 class="side-text-color">Left Side</h5>
                                <p>${l1}</p>
                                ${l2 ? `<p>${l2}</p>` : ""}
                            </div>
                            <div class="col align-self-center">
                                <h4>${score_str}</h4>
                            </div>
                            <div class="col">
                                <h5 class="side-text-color">Right Side</h5>
                                <p>${r1}</p>
                                ${r2 ? `<p>${r2}</p>` : ""}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.setTitle("Game");
        this.unhideNavbar();
        await this.setContent(content);
    }


    /* -------------------------------------------------------------------------------------------------------------------------------------------- */
    /*                                                                                                                                              */
    /*                                   ██████╗  ██████╗ ███╗   ██╗ ██████╗      ██████╗  █████╗ ███╗   ███╗███████╗                               */
    /*                                   ██╔══██╗██╔═══██╗████╗  ██║██╔════╝     ██╔════╝ ██╔══██╗████╗ ████║██╔════╝                               */
    /*                                   ██████╔╝██║   ██║██╔██╗ ██║██║  ███╗    ██║  ███╗███████║██╔████╔██║█████╗                                 */
    /*                                   ██╔═══╝ ██║   ██║██║╚██╗██║██║   ██║    ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝                                 */
    /*                                   ██║     ╚██████╔╝██║ ╚████║╚██████╔╝    ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗                               */
    /*                                   ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝      ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝                               */                                                           
    /*                                                                                                                                              */
    /* -------------------------------------------------------------- Main game function ---------------------------------------------------------- */

    async play_pong(player_left1, player_left2, player_right1, player_right2, tournament)
    {
        // Set canvas
        await this.goToGameView();

        var game_data = {};

        game_data.game_type = 'pong';

        game_data.fps = 100;
        game_data.delay = 1000 / game_data.fps;

        game_data.paused = false;
        game_data.end = false;
        game_data.score = [0,0];
        game_data.max_score = 5;
    
        game_data.balls = [];
        game_data.players = [];
        game_data.tournament = tournament;

        game_data.grid = 15;
        game_data.paddleHeight = game_data.grid * 5;
        game_data.canvas = document.getElementById('pong');
        game_data.context = game_data.canvas.getContext('2d');
        game_data.max_y = game_data.canvas.height - game_data.grid - game_data.paddleHeight;
    
    
        this.create_pong_ball(game_data, 'ball1', 0.5, 0.5, 7, 'left');
        //this.create_pong_ball(game_data, 'ball2', 0.5, 0.5, 7, 'right');

        if (player_left2 === null && player_right2 === null)
        {
            this.create_pong_player(game_data, player_left1, 'left', 0.5, 6, 'w', 's');
            this.create_pong_player(game_data, player_right1, 'right', 0.5, 6, 'ArrowUp', 'ArrowDown');   
        }
        else
        {
            this.create_pong_player(game_data, player_left1, 'left', 1/3, 6, 'w', 's');
            this.create_pong_player(game_data, player_right1, 'right', 1/3, 6, 'ArrowUp', 'ArrowDown');
            this.create_pong_player(game_data, player_left2, 'left', 2/3, 6, 'd', 'c');
            this.create_pong_player(game_data, player_right2, 'right', 2/3, 6, 'o', 'l');
        }    
    
        document.addEventListener('keydown', e => this.pause_listener(e, game_data));

        return await new Promise(resolve => {requestAnimationFrame(resolve);}).then(this.pong_loop.bind(this, game_data));
    }


    /* ------------------------------------------------------------ Game loop ------------------------------------------------------------ */

    async pong_loop(game_data)
    {
        game_data.canvas.focus();

        if (!game_data.paused)
        {
            // move players
            game_data.players.forEach(this.move_pong_player.bind(null, game_data));

            // move balls
            game_data.balls.forEach(this.move_pong_ball.bind(this, game_data));

            // check collisions
            game_data.players.forEach(this.handle_pong_players.bind(this, game_data));

            // draw frame    
            this.draw_pong_frame(game_data);
        }

        // end or new frame
        if (game_data.end)
            return this.handle_game_end.bind(this, game_data)();
        else
        {
            await new Promise(r => setTimeout(r, game_data.delay));
            return new Promise(resolve => {requestAnimationFrame(resolve);}).then(this.pong_loop.bind(this, game_data));
        }
    }


    /* -------------------------------------------------------------- Game helpers ---------------------------------------------------------- */

    create_pong_ball(game_data, name, x, y, speed, left)
    {
        var ball =
        {
            name : name,
            x: game_data.canvas.width * x,
            y: game_data.canvas.height * y,
            width: game_data.grid,
            height: game_data.grid,
            resetting: false,
            speed: speed,
            dx: (left === 'left' ? speed : -speed),
            dy: speed,
        }

        game_data.balls.push(ball);
    }

    create_pong_player(game_data, name, side, start_y, speed, up, down)
    {
        var player =
        {
            name: name,
            side: (side === "left" ? "left" : "right"),
            x: (side === "left" ? game_data.grid * 0 : game_data.canvas.width - game_data.grid),
            y: (game_data.canvas.height - game_data.paddleHeight) * start_y,
            width: game_data.grid,
            height: game_data.paddleHeight,
            speed: speed,
            dy: 0
        };

        this.add_pong_player_listeners(player, up, down);

        game_data.players.push(player);
    }

    move_pong_player(game_data, player)
    {
        if ((player.y + player.dy < game_data.grid) || (player.y + player.dy > game_data.max_y))
        {
            if (player.dy > 0)
                player.y = game_data.max_y;
            else
                player.y = game_data.grid;
        }
        else
            player.y = player.y + player.dy;
    }

    move_pong_ball(game_data, ball)
    {
        ball.x += ball.dx;
        ball.y += ball.dy;
    
        if (ball.y < game_data.grid || ball.y + game_data.grid > game_data.canvas.height - game_data.grid)
        {
            ball.y = (ball.y < game_data.grid ? game_data.grid : game_data.canvas.height - game_data.grid * 2);
            ball.dy *= -1;
        }
    
        if ((ball.x < 0 || ball.x > game_data.canvas.width) && !ball.resetting)
        {
            ball.resetting = true;
            ball.x > game_data.canvas.width ? game_data.score[0]++ : game_data.score[1]++;
            setTimeout(this.reset_pong_ball.bind(this, ball, game_data), 400);
        }
    }

    handle_pong_players(game_data, player)
    {
        game_data.balls.forEach(this.handle_pong_collision.bind(null, player));
    }

    handle_pong_collision(player, ball)
    {
        if (ball.resetting)
            return;

        if ((ball.x < player.x + player.width) && (ball.x + ball.width > player.x) && (ball.y < player.y + player.height) && (ball.y + ball.height > player.y))
        {
            ball.dx *= -1;
            ball.x = player.x + (player.side === "left" ? player.width : -player.width);
        }
    }


    /* ---------------------------------------------------------------- Draw helpers ---------------------------------------------------------------- */    

    draw_pong_frame(game_data)
    {
        // draw background
        this.draw_pong_background(game_data);

        // draw players
        game_data.players.forEach(this.draw_pong_object.bind(null, game_data));

        // draw balls
        game_data.balls.forEach(this.draw_pong_object.bind(null, game_data));
    }

    draw_pong_background(game_data)
    {
        var ctx = game_data.context;
        var cnv = game_data.canvas;

        // reset background
        ctx.fillStyle = 'black';
        ctx.clearRect(0, 0, cnv.width, cnv.height);
        ctx.fillRect(0, 0, cnv.width, cnv.height);

        // draw walls and middle line
        ctx.fillStyle = 'orange';
        ctx.fillRect(0, 0, cnv.width, game_data.grid);
        ctx.fillRect(0, cnv.height - game_data.grid, cnv.width, cnv.height);
        for (let i = game_data.grid; i < cnv.height - game_data.grid; i += game_data.grid * 2)
            ctx.fillRect(cnv.width / 2 - game_data.grid / 2, i, game_data.grid, game_data.grid);

        // draw score
        ctx.textAlign = 'center', ctx.font = '50px "Press Start 2P", Arial, sans-serif', ctx.fillStyle = 'white';
        ctx.fillText(game_data.score[0] + '  ' + game_data.score[1], cnv.width / 2, cnv.height * 0.2);
    }

    draw_pong_object(game_data, object)
    {
        game_data.context.fillStyle = 'white';
        game_data.context.fillRect(object.x, object.y, object.width, object.height);
    }


    /* ------------------------------------------------------------ Key press listeners ------------------------------------------------------------ */

    add_pong_player_listeners(player, up, down)
    {
        document.addEventListener('keydown', e => this.pong_player_keydown_listener(e, player, up, down));
        document.addEventListener('keyup', e => this.pong_player_keyup_listener(e, player, up, down));
    }

    pong_player_keydown_listener(e, player, up, down)
    {
        if (e.key === up)
            player.dy = -player.speed;
        else if (e.key === down)
            player.dy = player.speed;
    }

    pong_player_keyup_listener(e, player, up, down)
    {
        if (e.key === up || e.key === down)
            player.dy = 0;
    }


    /* ----------------------------------------------------------- Reset ball or end function ----------------------------------------------------------- */    

    reset_pong_ball(ball, game_data)
    {
        if (game_data.score[0] >= game_data.max_score || game_data.score[1] >= game_data.max_score)
            game_data.end = true;
        else
        {
            ball.resetting = false;
            ball.x = game_data.canvas.width / 2;
            ball.y = game_data.canvas.height / 2;
        }
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
    /* -------------------------------------------------------------- Snek game function ---------------------------------------------------------- */
    
    async play_snek(player_left1, player_left2, player_right1, player_right2, tournament)
    {
        // Set canvas
        await this.goToGameView();

        var game_data = {};

        game_data.game_type = 'snek';

        game_data.fps = 10;
        game_data.delay = 1000 / game_data.fps;
    
        game_data.players = [];
        game_data.score = [0,0];
        game_data.tournament = tournament;

        game_data.grid = 15;
        game_data.paused = false;
        game_data.visited_cells = new Set();
        game_data.canvas = document.getElementById('pong');
        game_data.context = game_data.canvas.getContext('2d');
        game_data.cols = game_data.canvas.width / game_data.grid;
        game_data.rows = game_data.canvas.height / game_data.grid;

        if (player_left2 === null && player_right2 === null)
        {
            this.create_snek_player(game_data, player_left1, 'left', '#24a7a1', 20, 4, 1, 0, 'w', 's', 'a', 'd', 'r');
            this.create_snek_player(game_data, player_right1, 'right', '#ff9810', 20, 55, -1, 0, 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', "l");
        }
        else
        {
            this.create_snek_player(game_data, player_left1, 'left', '#24a7a1', 10, 4, 1, 0, 'w', 's', 'a', 'd', 'r');
            this.create_snek_player(game_data, player_right1, 'right', '#ff9810', 10, 55, -1, 0, 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', "l");
            this.create_snek_player(game_data, player_left2, 'left', '#24a7a1', 30, 4, 1, 0, '1', '2', '3', '4', '5');
            this.create_snek_player(game_data, player_right2, 'right', '#ff9810', 30, 55, -1, 0, '6', '7', '8', '9', "0");
        }

        this.draw_initial_snek_frame.bind(this, game_data)();
    
        document.addEventListener('keydown', e => this.pause_listener(e, game_data));

        await new Promise(resolve => {requestAnimationFrame(resolve);}).then(this.snek_loop.bind(this, game_data));
        console.log('---------- END ----------');
    }


    /* ------------------------------------------------------- Snek Game loop ------------------------------------------------------------ */

    async snek_loop(game_data)
    {

        game_data.canvas.focus();
    
        if (!game_data.paused)
            game_data.players.forEach(this.handle_snek_player.bind(this, game_data));

        if (game_data.players.filter(player => player.dead === true).length === 0)
        {
            await new Promise(r => setTimeout(r, game_data.delay));
            return new Promise(resolve => {requestAnimationFrame(resolve);}).then(this.snek_loop.bind(this, game_data));
        }
        else
        {
            game_data.score[0] = game_data.players.filter(player => player.dead === false && player.side === 'left').length; // no. left alive
            game_data.score[1] = game_data.players.filter(player => player.dead === false && player.side === 'right').length; // no. right alive

            if (game_data.score[0] !== game_data.score[1])
            {
                return this.handle_game_end.bind(this, game_data)();
            }
            else
            {
                await new Promise(r => setTimeout(r, 400));
                this.reset_snek_game(game_data);
                return new Promise(resolve => {requestAnimationFrame(resolve);}).then(this.snek_loop.bind(this, game_data));
            }
        }
    }

    handle_snek_player(game_data, player)
    {
        if (!this.snek_move_to_cell(game_data, player))
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

    snek_move_to_cell(game_data, player)
    {
        var current_cell = `${player.x}-${player.y}`

        if (player.x < 0 || player.x >= game_data.cols || player.y < 0 || player.y >= game_data.rows)
            return false;
        if (game_data.visited_cells.has(current_cell))
            return false;
        game_data.visited_cells.add(current_cell);
        return true;
    }

    /* ---------------------------------------------------------- Snek Game helpers ---------------------------------------------------------- */

    create_snek_player(game_data, name, side, color, y, x, dx, dy, up, down, left, right, jump)
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

        this.add_snek_player_listeners(player, up, down, left, right, jump);

        game_data.players.push(player);
    }

    draw_initial_snek_frame(game_data)
    {
        this.draw_snek_background(game_data);
        game_data.players.forEach(this.draw_snek_start.bind(null, game_data));
    }

    draw_snek_start(game_data, player)
    {
        var grd = game_data.grid;

        game_data.context.fillStyle = player.color;
        game_data.context.fillRect(player.x * grd, player.y * grd, game_data.grid, game_data.grid);
        game_data.context.strokeStyle = 'black';
        game_data.context.strokeRect(player.x * grd, player.y * grd, game_data.grid, game_data.grid);
    };

    draw_snek_background(game_data)
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

    reset_snek_game(game_data)
    {
        game_data.visited_cells = new Set();

        game_data.players.forEach(this.reset_snek_player);

        this.draw_initial_snek_frame.bind(this, game_data)();
    }

    reset_snek_player(player)
    {
        player.x = player.start_x;
        player.y = player.start_y;
        player.dx = player.start_dx;
        player.dy = player.start_dy;
        player.dead = false;
    }

    /* ------------------------------------------------------------ Key press listeners ------------------------------------------------------------ */

    add_snek_player_listeners(player, up, down, left, right, jump)
    {
        document.addEventListener('keydown', e => this.snek_pong_player_keydown_listener(e, player, up, down, left, right, jump));
    }

    snek_pong_player_keydown_listener(e, player, up, down, left, right, jump)
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


    /* -------------------------------------------------------------------------------------------------------------------------------------------- */
    /*                                                                                                                                              */
    /*                                                ███████╗██╗  ██╗ █████╗ ██████╗ ███████╗██████╗                                               */
    /*                                                ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗                                              */
    /*                                                ███████╗███████║███████║██████╔╝█████╗  ██║  ██║                                              */
    /*                                                ╚════██║██╔══██║██╔══██║██╔══██╗██╔══╝  ██║  ██║                                              */
    /*                                                ███████║██║  ██║██║  ██║██║  ██║███████╗██████╔╝                                              */
    /*                                                ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═════╝                                               */
    /*                                                                                                                                              */
    /* ----------------------------------------------------------- Shared game functions ---------------------------------------------------------- */

    /* ------------------------------------------------------- Post game handling functions ------------------------------------------------------- */

     async handle_game_end(game_data)
    {
       try
        {
           var winners = this.get_winners(game_data);
           var loosers = this.get_loosers(game_data);
           var score_str = game_data.score[0].toString() + " - " + game_data.score[1].toString();

           await this.push_game(game_data.game_type, game_data.tournament, winners[0], winners[1], loosers[0], loosers[1], score_str);
           await this.display_result(game_data.tournament);
           return Promise.resolve();
       }
       catch (err) {return;}
    }
    
    get_winners(game_data)
    {
        var winning_side = (game_data.score[0] > game_data.score[1] ? 'left' : 'right');
        var winners = game_data.players.filter(player => player.side === winning_side).map(player => player.name);
        if (winners.length === 1)
            winners.push(null);

        return winners;
    }
    
    get_loosers(game_data)
    {
        var losing_side = (game_data.score[0] > game_data.score[1] ? 'right' : 'left');
        var loosers = game_data.players.filter(player => player.side === losing_side).map(player => player.name);
        if (loosers.length === 1)
            loosers.push(null);

        return loosers;
    }
 
    async push_game(game_type, tournament, w1, w2, l1, l2, score)
    {
        try
        {
            const response = await fetch("pong_api/pong_push_game/", {
                    method: "POST",
                    headers: {'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken')},
                    body: JSON.stringify({game_type: game_type, tournament: tournament, winner1: w1, winner2: w2, loser1: l1, loser2: l2, score: score})});
            if (!response.ok)
                throw new Error("Failed to push game");
        }
        catch (err)
        {
            console.error(err.message);
            await this.goToError();
            throw err;
        }
    };
     
    async display_result()
    {
        await this.goToResult();
    };

    
    /* ------------------------------------------------------------ Key press listeners ------------------------------------------------------------ */
    
    pause_listener(e, game_data)
    {
        if (e.key === "Enter")
        {
            game_data.paused = !game_data.paused;
        }
    }
}