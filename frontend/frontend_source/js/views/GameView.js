
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
        <br> <button id="play_game" class="1v1"> Play 1v1 pong </button> </br>

        <br></br>
        
        <br>
            <label for="left-select1"> Choose left player 1: </label>
            <select name="LeftPlayer1" id="left-select1">
            <option>${json.data["players"]["p1"]["name"]}</option>
            <option>${json.data["players"]["p2"]["name"]}</option>
            <option>${json.data["players"]["p3"]["name"]}</option>
            <option>${json.data["players"]["p4"]["name"]}</option>
            </select>

            <label for="right-select1"> Choose right player 1: </label>
            <select name="RightPlayer1" id="right-select1">
            <option>${json.data["players"]["p1"]["name"]}</option>
            <option>${json.data["players"]["p2"]["name"]}</option>
            <option>${json.data["players"]["p3"]["name"]}</option>
            <option>${json.data["players"]["p4"]["name"]}</option>
            </select>
        </br>

        <br>
            <label for="left-select2"> Choose left player 2: </label>
            <select name="LeftPlayer2" id="left-select2">
            <option>${json.data["players"]["p1"]["name"]}</option>
            <option>${json.data["players"]["p2"]["name"]}</option>
            <option>${json.data["players"]["p3"]["name"]}</option>
            <option>${json.data["players"]["p4"]["name"]}</option>
            </select>

            <label for="right-select2"> Choose right player 2: </label>
            <select name="RightPlayer2" id="right-select2">
            <option>${json.data["players"]["p1"]["name"]}</option>
            <option>${json.data["players"]["p2"]["name"]}</option>
            <option>${json.data["players"]["p3"]["name"]}</option>
            <option>${json.data["players"]["p4"]["name"]}</option>
            </select>
        </br>
        <br> <button id="play_game" class="2v2"> Play 2v2 pong </button> </br>
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
    
    
        this.create_ball(game_data, 'ball1', 0.5, 0.5, 7, 'left');
        //this.create_ball(game_data, 'ball2', 0.5, 0.5, 7, 'right');

        if (player_left2 === null && player_right2 === null)
        {
            this.create_player(game_data, player_left1, 'left', 0.5, 6, 'w', 's');
            this.create_player(game_data, player_right1, 'right', 0.5, 6, 'ArrowUp', 'ArrowDown');   
        }
        else
        {
            this.create_player(game_data, player_left1, 'left', 1/3, 6, 'w', 's');
            this.create_player(game_data, player_right1, 'right', 1/3, 6, 'ArrowUp', 'ArrowDown');
            this.create_player(game_data, player_left2, 'left', 2/3, 6, 'd', 'c');
            this.create_player(game_data, player_right2, 'right', 2/3, 6, 'o', 'l');
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
            game_data.players.forEach(this.move_player.bind(null, game_data));

            // move balls
            game_data.balls.forEach(this.move_ball.bind(this, game_data));

            // check collisions
            game_data.players.forEach(this.handle_players_collisions.bind(this, game_data));

            // draw frame    
            this.draw_frame(game_data);
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

    create_ball(game_data, name, x, y, speed, left)
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

    create_player(game_data, name, side, start_y, speed, up, down)
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

        this.add_player_listeners(player, up, down);

        game_data.players.push(player);
    }

    move_player(game_data, player)
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

    move_ball(game_data, ball)
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
            setTimeout(this.resetBall.bind(this, ball, game_data), 400);
        }
    }

    handle_players_collisions(game_data, player)
    {
        game_data.balls.forEach(this.handle_collision.bind(null, player));
    }

    handle_collision(player, ball)
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

    draw_frame(game_data)
    {
        // draw background
        this.draw_background(game_data);

        // draw players
        game_data.players.forEach(this.draw_object.bind(null, game_data));

        // draw balls
        game_data.balls.forEach(this.draw_object.bind(null, game_data));
    }

    draw_background(game_data)
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

    draw_object(game_data, object)
    {
        game_data.context.fillStyle = 'white';
        game_data.context.fillRect(object.x, object.y, object.width, object.height);
    }


    /* ------------------------------------------------------------ Key press listeners ------------------------------------------------------------ */

    add_player_listeners(player, up, down)
    {
        document.addEventListener('keydown', e => this.player_keydown_listener(e, player, up, down));
        document.addEventListener('keyup', e => this.player_keyup_listener(e, player, up, down));
    }

    player_keydown_listener(e, player, up, down)
    {
        if (e.key === up)
            player.dy = -player.speed;
        else if (e.key === down)
            player.dy = player.speed;
    }

    player_keyup_listener(e, player, up, down)
    {
        if (e.key === up || e.key === down)
            player.dy = 0;
    }

    pause_listener(e, game_data)
    {
        if (e.key === "Enter")
        {
            game_data.paused = !game_data.paused;
        }
    }


    /* ----------------------------------------------------------- Reset ball or end function ----------------------------------------------------------- */    

    resetBall(ball, game_data)
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


    /* ---------------------------------------------------------- Post game handling functions ---------------------------------------------------------- */

    async handle_game_end(game_data)
    {
        try
        {
            var winners = this.get_winners(game_data);
            var loosers = this.get_loosers(game_data);
            var score_str = game_data.score[0].toString() + " - " + game_data.score[1].toString();

            await this.push_game(game_data.tournament, winners[0], winners[1], loosers[0], loosers[1], score_str);
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

    async push_game(tournament, w1, w2, l1, l2, score)
    {
        try
        {
            const response = await fetch("pong_api/pong_push_game/", {
                    method: "POST",
                    headers: {'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken')},
                    body: JSON.stringify({tournament: tournament, winner1: w1, winner2: w2, loser1: l1, loser2: l2, score: score})});
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
}