
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

        if (json.data["unfinished_tournament"] === null)
        {
            var content = `<button id="create_tournament"> Create NEW tournament </button>`;
            return this.setContent(content)
        }


        var semi1_div_content, semi2_div_content, final_div_content;


        // --------------------------------------- semi1_div_content --------------------------------------- 
        if (json.data["unfinished_tournament"]["semi1_score"] === null)
        {
            semi1_div_content = `
            <br>
                <label for="left-select">Left:</label>
                <select name="LeftPlayer" id="left-select">
                <option>${json.data["unfinished_tournament"]["semi_one_p1"]}</option>
                <option>${json.data["unfinished_tournament"]["semi_one_p2"]}</option>
                </select>
            </br>
                <label for="right-select">Right:</label>
                <select name="RightPlayer" id="right-select">
                <option>${json.data["unfinished_tournament"]["semi_one_p1"]}</option>
                <option>${json.data["unfinished_tournament"]["semi_one_p2"]}</option>
                </select>

            <br> <button id="play_game" class="Tournament1"> Play pong </button> </br>
            `
        }
        else
        {
            semi1_div_content = `
            <br>winner: ${json.data["unfinished_tournament"]["semi1_winner"]}</br>
            loser: ${json.data["unfinished_tournament"]["semi1_loser"]}
            <br>score: ${json.data["unfinished_tournament"]["semi1_score"]}</br>
            `
        }


        // --------------------------------------- semi2_div_content --------------------------------------- 
        if (json.data["unfinished_tournament"]["semi2_score"] === null)
        {
            semi2_div_content = `
            <br>
                <label for="left-select">Left:</label>
                <select name="LeftPlayer" id="left-select">
                <option>${json.data["unfinished_tournament"]["semi_two_p1"]}</option>
                <option>${json.data["unfinished_tournament"]["semi_two_p2"]}</option>
                </select>
            </br>
            
                <label for="right-select">Right:</label>
                <select name="RightPlayer" id="right-select">
                <option>${json.data["unfinished_tournament"]["semi_two_p1"]}</option>
                <option>${json.data["unfinished_tournament"]["semi_two_p2"]}</option>
                </select>

            <br> <button id="play_game" class="Tournament2"> Play pong </button> </br>
            `
        }
        else
        {
            semi2_div_content = `
            <br>winner: ${json.data["unfinished_tournament"]["semi2_winner"]}</br>
            loser: ${json.data["unfinished_tournament"]["semi2_loser"]}
            <br>score: ${json.data["unfinished_tournament"]["semi2_score"]}</br>
                `
        }


        // --------------------------------------- final_div_content --------------------------------------- 
        if (json.data["unfinished_tournament"]["semi1_score"] !== null && json.data["unfinished_tournament"]["semi2_score"] !== null)
        {
            final_div_content = `
            <br>
                <label for="left-select">Left:</label>
                <select name="LeftPlayer" id="left-select">
                <option>${json.data["unfinished_tournament"]["semi1_winner"]}</option>
                <option>${json.data["unfinished_tournament"]["semi2_winner"]}</option>
                </select>
            </br>
            
                <label for="right-select">Right:</label>
                <select name="RightPlayer" id="right-select">
                <option>${json.data["unfinished_tournament"]["semi1_winner"]}</option>
                <option>${json.data["unfinished_tournament"]["semi2_winner"]}</option>
                </select>

            <br> <button id="play_game" class="Tournament3"> Play pong </button> </br>
            `
        }
        else
        {
            final_div_content = `<br>Waiting for semifinals</br>`
        }


        // --------------------------------------- total content --------------------------------------- 
        var content = `

        <div id="tournament_semi1_div">
            Semifinal 1
            ${semi1_div_content}
        </div>

        <div id="tournament_semi2_div">
            Semifinal 2
            ${semi2_div_content}
        </div>

        <div id="tournament_final_div">
            Final
            ${final_div_content}
        </div>
        `;


        this.setTitle("Tournament");
        this.setContent(content);
    }
}