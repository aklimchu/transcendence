
import GameView from "./GameView.js";

export default class extends GameView
{
    constructor(params)
    {
        super(params);
    }

    async goToView() {
        try {
            var json = await this.fetchSessionData();
        } catch (err) {
            return;
        }
    
        if (json.data["unfinished_tournament"] === null) {
        var content = `
        <div class="container text-center mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <button type="button" id="create_pong_tournament" class="custom-btn mb-3 pong">Create Pong Tournament</button>
                    <button type="button" id="create_snek_tournament" class="custom-btn mb-3 snek">Create Snek Tournament</button>
                </div>
            </div>
        </div>`;
            this.setTitle("Tournament");
            this.unhideNavbar();
            await this.setContent(content);
            return;
        }
    
        var semi1_div_content, semi2_div_content, final_div_content, game_type;
        if (json.data["unfinished_tournament"]["tournament_type"] === 'pong')
            game_type = 'pong';
        else
            game_type = 'snek';
        
    
        // --------------------------------------- Semifinal 1 ---------------------------------------
        console.log(json.data["unfinished_tournament"]);
        if (json.data["unfinished_tournament"]["semi1_score"] === null) {
            semi1_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header">Semifinal 1</div>
                    <div class="card-body">
                        <label for="semi1-left" class="form-label">Left Player</label>
                        <select id="semi1-left" class="form-select">
                            <option>${json.data["unfinished_tournament"]["semi_one_p1"]}</option>
                            <option>${json.data["unfinished_tournament"]["semi_one_p2"]}</option>
                        </select>
    
                        <label for="semi1-right" class="form-label mt-2">Right Player</label>
                        <select id="semi1-right" class="form-select">
                            <option>${json.data["unfinished_tournament"]["semi_one_p1"]}</option>
                            <option>${json.data["unfinished_tournament"]["semi_one_p2"]}</option>
                        </select>
    
                        <button type="button" class="play_game_btn btn btn-warning mt-3 ${game_type} 1v1 T1" data-left="semi1-left" data-right="semi1-right">
                            Play ${game_type}
                        </button>
                    </div>
                </div>`;
        } else {
            semi1_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header">Semifinal 1</div>
                    <div class="card-body">
                        <p><strong>Winner:</strong> ${json.data["unfinished_tournament"]["semi1_winner"]}</p>
                        <p><strong>Loser:</strong> ${json.data["unfinished_tournament"]["semi1_loser"]}</p>
                        <p><strong>Score:</strong> ${json.data["unfinished_tournament"]["semi1_score"]}</p>
                    </div>
                </div>`;
        }
    
        // --------------------------------------- Semifinal 2 ---------------------------------------
        if (json.data["unfinished_tournament"]["semi2_score"] === null) {
            semi2_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header">Semifinal 2</div>
                    <div class="card-body">
                        <label for="semi2-left" class="form-label">Left Player</label>
                        <select id="semi2-left" class="form-select">
                            <option>${json.data["unfinished_tournament"]["semi_two_p1"]}</option>
                            <option>${json.data["unfinished_tournament"]["semi_two_p2"]}</option>
                        </select>
    
                        <label for="semi2-right" class="form-label mt-2">Right Player</label>
                        <select id="semi2-right" class="form-select">
                            <option>${json.data["unfinished_tournament"]["semi_two_p1"]}</option>
                            <option>${json.data["unfinished_tournament"]["semi_two_p2"]}</option>
                        </select>
    
                        <button type="button" id="play_game" class="btn btn-warning mt-3 ${game_type} 1v1 T2">Play ${game_type}</button>
                    </div>
                </div>`;
        } else {
            semi2_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header">Semifinal 2</div>
                    <div class="card-body">
                        <p><strong>Winner:</strong> ${json.data["unfinished_tournament"]["semi2_winner"]}</p>
                        <p><strong>Loser:</strong> ${json.data["unfinished_tournament"]["semi2_loser"]}</p>
                        <p><strong>Score:</strong> ${json.data["unfinished_tournament"]["semi2_score"]}</p>
                    </div>
                </div>`;
        }
    
        // --------------------------------------- Final ---------------------------------------
        if (json.data["unfinished_tournament"]["semi1_score"] !== null && json.data["unfinished_tournament"]["semi2_score"] !== null) {
            final_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header">Final</div>
                    <div class="card-body">
                        <label for="final-left" class="form-label">Left Player</label>
                        <select id="final-left" class="form-select">
                            <option>${json.data["unfinished_tournament"]["semi1_winner"]}</option>
                            <option>${json.data["unfinished_tournament"]["semi2_winner"]}</option>
                        </select>
    
                        <label for="final-right" class="form-label mt-2">Right Player</label>
                        <select id="final-right" class="form-select">
                            <option>${json.data["unfinished_tournament"]["semi1_winner"]}</option>
                            <option>${json.data["unfinished_tournament"]["semi2_winner"]}</option>
                        </select>
    
                        <button type="button" id="play_game" class="btn btn-danger mt-3 ${game_type} 1v1 T3">Play ${game_type}</button>
                    </div>
                </div>`;
        } else {
            final_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header">Final</div>
                    <div class="card-body">
                        <p>Waiting for semifinals...</p>
                    </div>
                </div>`;
        }
    
        // --------------------------------------- Total Content ---------------------------------------
        var content = `
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-6">${semi1_div_content}</div>
                    <div class="col-md-6">${semi2_div_content}</div>
                </div>
                <div class="row justify-content-center mt-4">
                    <div class="col-md-8">${final_div_content}</div>
                </div>
            </div>`;
    
        this.setTitle("Tournament");
        this.unhideNavbar();
        await this.setContent(content);
    }
    

    async goToResult()
    {
        try {var json = await this.fetchSessionData();}
        catch (err) {return;}

        var content = `

        <button type="button" id="tournament_view" sub-view-reference> Go back </button>

        <br> Tournament completed! </br>

        <div id="tournament_semi1_div">
            Semifinal 1
            <br>winner: ${json.data["finished_tournaments"][0]["semi1_winner"]}</br>
            loser: ${json.data["finished_tournaments"][0]["semi1_loser"]}
            <br>score: ${json.data["finished_tournaments"][0]["semi1_score"]}</br>
        </div>

        <div id="tournament_semi2_div">
            Semifinal 2
            <br>winner: ${json.data["finished_tournaments"][0]["semi2_winner"]}</br>
            loser: ${json.data["finished_tournaments"][0]["semi2_loser"]}
            <br>score: ${json.data["finished_tournaments"][0]["semi2_score"]}</br>
        </div>

        <div id="tournament_final_div">
            Final
            <br>winner: ${json.data["finished_tournaments"][0]["final_winner"]}</br>
            loser: ${json.data["finished_tournaments"][0]["final_loser"]}
            <br>score: ${json.data["finished_tournaments"][0]["final_score"]}</br>
        </div>
        `;


        this.setTitle("Tournament");
        this.unhideNavbar();
        await this.setContent(content);
    }


    /* ---------------------------------------------------------- Post game handling functions ---------------------------------------------------------- */

    async display_result(tournament)
    {
        if (tournament === 3)
            await this.goToResult();
        else
            await this.goToView();
    };
}