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
                        <button type="button" class="play_game_btn btn btn-warning mt-3 ${game_type} 1v1 T1" data-left="semi1-left" data-right="semi1-right" style="background-color: #ffa500;">
                            Play ${game_type}
                        </button>
                    </div>
                </div>`;
        } else {
            semi1_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header">Semifinal 1</div>
                    <div class="card-body">
                        <p><span class="fw-bold">Winner:</span> ${json.data["unfinished_tournament"]["semi1_winner"]}</p>
                        <p><span class="fw-bold">Loser:</span> ${json.data["unfinished_tournament"]["semi1_loser"]}</p>
                        <p><span class="fw-bold">Score:</span> ${json.data["unfinished_tournament"]["semi1_score"]}</p>
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
                        <button type="button" class="play_game_btn btn btn-warning mt-3 ${game_type} 1v1 T2" data-left="semi2-left" data-right="semi2-right" style="background-color: #ffa500;">
                            Play ${game_type}
                        </button>
                    </div>
                </div>`;
        } else {
            semi2_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header">Semifinal 2</div>
                    <div class="card-body">
                        <p><span class="fw-bold">Winner:</span> ${json.data["unfinished_tournament"]["semi2_winner"]}</p>
                        <p><span class="fw-bold">Loser:</span> ${json.data["unfinished_tournament"]["semi2_loser"]}</p>
                        <p><span class="fw-bold">Score:</span> ${json.data["unfinished_tournament"]["semi2_score"]}</p>
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
                        <button type="button" class="play_game_btn btn btn-danger mt-3 ${game_type} 1v1 T3" data-left="final-left" data-right="final-right">
                            Play ${game_type}
                        </button>
                    </div>
                </div>`;
        } else {
            final_div_content = `
                <div class="card text-center mb-3">
                    <div class="card-header">Final</div>
                    <div class="card-body">
                        <p><span class="fw-bold">Waiting for semifinals...</span></p>
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
        <div class="container my-3">
            <button type="button" id="tournament_view" class="btn btn-secondary mb-4" sub-view-reference>
                Go back
            </button>
            <h3 class="text-center mb-4">Tournament Completed!</h3>
            
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card mb-3 p-4 fs-5">
                        <div class="card-header">Semifinal 1</div>
                        <div class="card-body">
                            <p><span class="fw-bold">Winner:</span> ${json.data["finished_tournaments"][0]["semi1_winner"]}</p>
                            <p><span class="fw-bold">Loser:</span> ${json.data["finished_tournaments"][0]["semi1_loser"]}</p>
                            <p><span class="fw-bold">Score:</span> ${json.data["finished_tournaments"][0]["semi1_score"]}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card mb-3 p-4 fs-5">
                        <div class="card-header">Semifinal 2</div>
                        <div class="card-body">
                            <p><span class="fw-bold">Winner:</span> ${json.data["finished_tournaments"][0]["semi2_winner"]}</p>
                            <p><span class="fw-bold">Loser:</span> ${json.data["finished_tournaments"][0]["semi2_loser"]}</p>
                            <p><span class="fw-bold">Score:</span> ${json.data["finished_tournaments"][0]["semi2_score"]}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="card p-4 fs-5">
                        <div class="card-header">Final</div>
                        <div class="card-body">
                            <p><span class="fw-bold">Winner:</span> ${json.data["finished_tournaments"][0]["final_winner"]}</p>
                            <p><span class="fw-bold">Loser:</span> ${json.data["finished_tournaments"][0]["final_loser"]}</p>
                            <p><span class="fw-bold">Score:</span> ${json.data["finished_tournaments"][0]["final_score"]}</p>
                        </div>
                    </div>
                </div>
            </div>
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