import AbstractView from "./Base_view.js";

export default class extends AbstractView
{
    constructor(params)
    {
        super(params);
        this.setTitle("Tournament");
    }

    async getHtml()
    {
        var response, json;

        try
        {
            response = await fetch("pong_api/pong_session_data/", {method: "GET"});
            if (!response.ok)
                throw new Error("Failed to retrieve session data");
            json = await response.json()

            if (json.data["unfinished_tournament"] === null)
            {
                response = await fetch("pong_api/pong_create_tournament/", {method: "GET"});
                if (!response.ok)   
                    throw new Error("Failed to create tournament");
                json = await response.json()
            }
        }
        catch (err)
        {
            console.error(err.message);
            return `Something went terribly worng!`;
        }

        var semi_one_box, semi_two_box, final_box;
        

        // Semifinal 1 box
        if (json.data["unfinished_tournament"]["semi1_score"] === null)
        {
            semi_one_box = `
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

            <br> <button type="submit" class="btn" onclick="play_pong(1)">Play pong</button> </br>
            `
        }
        else
        {
            semi_one_box = `
            <br>winner: ${json.data["unfinished_tournament"]["semi1_winner"]}</br>
            loser: ${json.data["unfinished_tournament"]["semi1_loser"]}
            <br>score: ${json.data["unfinished_tournament"]["semi1_score"]}</br>
            `
        }


        //Semifinal 2 box
        if (json.data["unfinished_tournament"]["semi2_score"] === null)
        {
            semi_two_box = `
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

            <br> <button type="submit" class="btn" onclick="play_pong(2)">Play pong</button> </br>
            `
        }
        else
        {
            semi_two_box = `
            <br>winner: ${json.data["unfinished_tournament"]["semi2_winner"]}</br>
            loser: ${json.data["unfinished_tournament"]["semi2_loser"]}
            <br>score: ${json.data["unfinished_tournament"]["semi2_score"]}</br>
                `
        }


        //Final box
        if (json.data["unfinished_tournament"]["semi1_score"] !== null && json.data["unfinished_tournament"]["semi2_score"] !== null)
        {
            final_box = `
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

            <br> <button type="submit" class="btn" onclick="play_pong(3)">Play pong</button> </br>
            `
        }
        else
        {
            final_box = `<br>Waiting for semifinals</br>`
        }


        return `

        <style>
            #semi_one_div
            {
                height: 20%;
                width: 37.5%;
                background-color:orange;
                position:absolute;
                left:15%;
                bottom:20%;
                margin:0;
            }

            #semi_two_div
            {
                height: 20%;
                width: 37.5%;
                background-color:orange;
                position:absolute;
                left:57.5%;
                bottom:20%;
                margin:0;
            }
            
            #final_div
            {
                height:20%;
                width:37.5%;
                background-color:orange;
                position:absolute;
                left:36.25%;
                bottom:50%;
            }
        </style>


        <div id="semi_one_div">
            Semifinal 1
            ${semi_one_box}
        </div>

        <div id="semi_two_div">
            Semifinal 2
            ${semi_two_box}
        </div>

        <div id="final_div">
            Final
            ${final_box}
        </div>
        `;
    }
}