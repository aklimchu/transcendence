
import AbstractView from "./AbstractView.js";

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


        var content = `

        <div id="lobby_p1_div">
            <br> ${json.data["players"]["p1"]["name"]} </br>
            <br> won: ${json.data["players"]["p1"]["won"]} </br>
            <br> lost: ${json.data["players"]["p1"]["lost"]} </br>
        </div>

        <div id="lobby_p2_div">
            <br> ${json.data["players"]["p2"]["name"]} </br>
            <br> won: ${json.data["players"]["p2"]["won"]} </br>
            <br> lost: ${json.data["players"]["p2"]["lost"]} </br>
        </div>

        <div id="lobby_p3_div">
            <br> ${json.data["players"]["p3"]["name"]} </br>
            <br> won: ${json.data["players"]["p3"]["won"]} </br>
            <br> lost: ${json.data["players"]["p3"]["lost"]} </br>
        </div>

        <div id="lobby_p4_div">
            <br> ${json.data["players"]["p4"]["name"]} </br>
            <br> won: ${json.data["players"]["p4"]["won"]} </br>
            <br> lost: ${json.data["players"]["p4"]["lost"]} </br>
        </div>
        `;

        this.setTitle("Lobby");
        this.setContent(content);
    }
}
