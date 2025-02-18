import AbstractView from "./Base_view.js";

export default class extends AbstractView
{
    constructor(params)
    {
        super(params);
    }

    async goToView()
    {
        try
        {
            var response = await fetch("pong_api/pong_session_data/", {method: "GET"});
            if (!response.ok)
              throw new Error("Failed to retrieve session data");
            var json = await response.json()
        }
        catch (err)
        {
            console.error(err.message);
            if (response.status === 401)
                return this.goToNoAuth();
            return this.goToError();
        }

        var tournament_button_txt;

        if (json.data["unfinished_tournament"] === null)
            tournament_button_txt = "Create tournament";
        else
            tournament_button_txt = "Continue tournament";

        var content = `
        
        <br>
            <label for="left-select">Choose left player:</label>
            <select name="LeftPlayer" id="left-select">
            <option>${json.data["players"]["p1"]["name"]}</option>
            <option>${json.data["players"]["p2"]["name"]}</option>
            <option>${json.data["players"]["p3"]["name"]}</option>
            <option>${json.data["players"]["p4"]["name"]}</option>
            </select>

            <label for="right-select">Choose right player:</label>
            <select name="RightPlayer" id="right-select">
            <option>${json.data["players"]["p1"]["name"]}</option>
            <option>${json.data["players"]["p2"]["name"]}</option>
            <option>${json.data["players"]["p3"]["name"]}</option>
            <option>${json.data["players"]["p4"]["name"]}</option>
            </select>
        </br>
        <br> <button id="play_game" class="1v1"> Play pong </button> </br>
        `;

        this.setTitle("Game");
        this.setContent(content);
    }
}