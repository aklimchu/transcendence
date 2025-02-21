import Game from "./views/GameView.js";
import Tournament from "./views/TournamentView.js";

async function push_game(tournament, w1, w2, l1, l2, score)
{
    try
    {
        const response = await fetch("pong_api/pong_push_game/", {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({tournament: tournament, winner1: w1, winner2: w2, loser1: l1, loser2: l2, score: score})});
        if (!response.ok)
            throw new Error("Failed to push game");
    }
    catch (err)
    {
        console.error(err.message);
        var error_view = new Game;
        await error_view.goToError();
        throw err;
    }
};

async function display_result(tournament)
{
    if (tournament === null)
    {    
        var result_view = new Game;
        result_view.goToResult();
    }
    else
    {
        var tournament_view = new Tournament;
        if (tournament === 3)
            tournament_view.goToResult();
        else
            tournament_view.goToView();
    }
};

export async function play_pong(tournament)
{
    var game_data = {};

    game_data.tournament = tournament;

    // Get players
    var left_select = document.getElementById("left-select");
    var right_select = document.getElementById("right-select");
    game_data.player_left = left_select.options[left_select.selectedIndex].text;
    game_data.player_right = right_select.options[right_select.selectedIndex].text;

    // Set canvas
    var game_view = new Game;
    await game_view.goToGameView();

    game_data.canvas = document.getElementById('pong');
    game_data.context = game_data.canvas.getContext('2d');
    game_data.grid = 15;
    game_data.paddleHeight = game_data.grid * 5;
    game_data.maxPaddleY = game_data.canvas.height - game_data.grid - game_data.paddleHeight;

    game_data.paused = false;
    game_data.end = false;
    game_data.score = [0,0];
    game_data.max_score = 5;

    game_data.paddleSpeed = 6;
    game_data.ballSpeed = 7;
    game_data.requestId;

    game_data.leftPaddle =
    {
        x: game_data.grid * 0,
        y: (game_data.canvas.height - game_data.paddleHeight) / 2,
        width: game_data.grid,
        height: game_data.paddleHeight,
        dy: 0
    };

    game_data.rightPaddle =
    {
        x: game_data.canvas.width - game_data.grid * 1,
        y: (game_data.canvas.height - game_data.paddleHeight) / 2,
        width: game_data.grid,
        height: game_data.paddleHeight,
        dy: 0
    };

    game_data.ball =
    {
        x: game_data.canvas.width / 2,
        y: game_data.canvas.height / 2,
        width: game_data.grid,
        height: game_data.grid,
        resetting: false,
        dx: game_data.ballSpeed,
        dy: -game_data.ballSpeed
    };

    function collides(obj1, obj2)
    {
        return obj1.x < obj2.x + obj2.width &&
                obj1.x + obj1.width > obj2.x &&
                obj1.y < obj2.y + obj2.height &&
                obj1.y + obj1.height > obj2.y;
    }


    // Pong loop
    async function loop(game_data)
    {
        console.log(game_data.player_left)

        game_data.canvas.focus();

        if (game_data.end)
            return;

        game_data.context.clearRect(0, 0, game_data.canvas.width, game_data.canvas.height);
        game_data.context.fillStyle = 'black';
        game_data.context.fillRect(0, 0, game_data.canvas.width, game_data.canvas.height);
        
        game_data.context.textAlign = 'center', game_data.context.font = '50px "Press Start 2P", Arial, sans-serif', game_data.context.fillStyle = 'white';
        game_data.context.fillText(game_data.score[0] + '  ' + game_data.score[1], game_data.canvas.width / 2, game_data.canvas.height * 0.2);

        // Move paddles
        game_data.leftPaddle.y += game_data.leftPaddle.dy;
        game_data.rightPaddle.y += game_data.rightPaddle.dy;

        // Check paddles out of bounds
        if (game_data.leftPaddle.y < game_data.grid)
            game_data.leftPaddle.y = game_data.grid;
        else if (game_data.leftPaddle.y > game_data.maxPaddleY)
            game_data.leftPaddle.y = game_data.maxPaddleY;

        if (game_data.rightPaddle.y < game_data.grid)
            game_data.rightPaddle.y = game_data.grid;
        else if (game_data.rightPaddle.y > game_data.maxPaddleY)
            game_data.rightPaddle.y = game_data.maxPaddleY;

        // draw paddles
        game_data.context.fillStyle = 'white';
        game_data.context.fillRect(game_data.leftPaddle.x, game_data.leftPaddle.y, game_data.leftPaddle.width, game_data.leftPaddle.height);
        game_data.context.fillRect(game_data.rightPaddle.x, game_data.rightPaddle.y, game_data.rightPaddle.width, game_data.rightPaddle.height);

        // move ball by its velocity
        game_data.ball.x += game_data.ball.dx;
        game_data.ball.y += game_data.ball.dy;

        // prevent ball from going through walls by changing its velocity
        if (game_data.ball.y < game_data.grid)
        {
            game_data.ball.y = game_data.grid;
            game_data.ball.dy *= -1;
        }
        else if (game_data.ball.y + game_data.grid > game_data.canvas.height - game_data.grid)
        {
            game_data.ball.y = game_data.canvas.height - game_data.grid * 2;
            game_data.ball.dy *= -1;
        }

        // reset ball if it goes past paddle (but only if we haven't already done so)
        if ( (game_data.ball.x < 0 || game_data.ball.x > game_data.canvas.width) && !game_data.ball.resetting)
        {
            game_data.ball.resetting = true;
            if (game_data.ball.x > game_data.canvas.width)
                game_data.score[0]++;
            else
            game_data.score[1]++;

            game_data.ballSpeed = 5;

            if (game_data.score[0] === game_data.max_score || game_data.score[1] === game_data.max_score)
            {
                window.cancelAnimationFrame(game_data.requestId);
                var score_str = game_data.score[0].toString() + " - " + game_data.score[1].toString();
                var winner = (game_data.score[0] > game_data.score[1]) ? game_data.player_left : game_data.player_right;
                var loser = (game_data.score[0] > game_data.score[1]) ? game_data.player_right : game_data.player_left;

                try
                {
                    await push_game(game_data.tournament, winner, null, loser, null, score_str);
                    return display_result(game_data.tournament);
                }
                catch (err) {return;}
            }

            // give some time for the player to recover before launching the ball again
            setTimeout(() => {
                game_data.ball.resetting = false;
                game_data.ball.x = game_data.canvas.width / 2;
                game_data.ball.y = game_data.canvas.height / 2;
                }, 400);
        }

        // check to see if ball collides with paddle. if they do change x velocity
        if (collides(game_data.ball, game_data.leftPaddle))
        {
            game_data.ball.dx *= -1;
            game_data.ball.x = game_data.leftPaddle.x + game_data.leftPaddle.width; // move ball otherwise collision happens next frame
            game_data.ballSpeed += 1
        }
        else if (collides(game_data.ball, game_data.rightPaddle))
        {
            game_data.ball.dx *= -1;
            game_data.ball.x = game_data.rightPaddle.x - game_data.ball.width; // move ball otherwise collision happens next frame
            game_data.ballSpeed += 1
        }

        // ball
        game_data.context.fillRect(game_data.ball.x, game_data.ball.y, game_data.ball.width, game_data.ball.height);

        // walls
        game_data.context.fillStyle = 'orange';
        game_data.context.fillRect(0, 0, game_data.canvas.width, game_data.grid);
        game_data.context.fillRect(0, game_data.canvas.height - game_data.grid, game_data.canvas.width, game_data.canvas.height);

        // dotted line
        for (let i = game_data.grid; i < game_data.canvas.height - game_data.grid; i += game_data.grid * 2)
            game_data.context.fillRect(game_data.canvas.width / 2 - game_data.grid / 2, i, game_data.grid, game_data.grid);

        game_data.requestId = window.requestAnimationFrame(loop.bind(null, game_data));
    }

    document.addEventListener('keydown',
        function(e)
        {
            if (e.key === "ArrowUp")
                game_data.rightPaddle.dy = -game_data.paddleSpeed;
            else if (e.key === "ArrowDown")
                game_data.rightPaddle.dy = game_data.paddleSpeed;

            if (e.key === "w")
                game_data.leftPaddle.dy = -game_data.paddleSpeed;
            else if (e.key === "s")
                game_data.leftPaddle.dy = game_data.paddleSpeed;

            if (e.key === "Enter")
            {
                game_data.paused = !game_data.paused;
                if (game_data.paused)    
                    window.cancelAnimationFrame(game_data.requestId);
                else
                    game_data.requestId = window.requestAnimationFrame(loop.bind(null, game_data));
            }
            if (e.key === "e")
                game_data.end = true;
        }
    );

    document.addEventListener('keyup',
        function(e)
        {
            if (e.key === "ArrowUp" || e.key === "ArrowDown")
                game_data.rightPaddle.dy = 0;

            if (e.key === "w" || e.key === "s")
                game_data.leftPaddle.dy = 0;
        }
    );

    game_data.requestId = window.requestAnimationFrame(loop.bind(null, game_data));
}