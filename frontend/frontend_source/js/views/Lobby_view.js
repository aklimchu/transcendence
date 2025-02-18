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


        var content = `
        
        <style>
            #div1
            {
                height:300px;
                width:300px;
                background-color:red;
                margin:0;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            #div2
            {
                height:300px;
                width:300px;
                background-color:green;
                position:relative;
                left:320px;
                bottom:300px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            #div3
            {
                height:300px;
                width:300px;
                background-color:yellow;
                position:relative;
                bottom:280px;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            #div4
            {
                height:300px;
                width:300px;
                background-color:blue;
                position:relative;
                left:320px;
                bottom:580px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        </style>

        <body>

        <div id="div1">
            <br> ${json.data["players"]["p1"]["name"]} </br>
            <br> won: ${json.data["players"]["p1"]["won"]} </br>
            <br> lost: ${json.data["players"]["p1"]["lost"]} </br>
        </div>

        <div id="div2">
            <br> ${json.data["players"]["p2"]["name"]} </br>
            <br> won: ${json.data["players"]["p2"]["won"]} </br>
            <br> lost: ${json.data["players"]["p2"]["lost"]} </br>
        </div>

        <div id="div3">
            <br> ${json.data["players"]["p3"]["name"]} </br>
            <br> won: ${json.data["players"]["p3"]["won"]} </br>
            <br> lost: ${json.data["players"]["p3"]["lost"]} </br>
        </div>

        <div id="div4">
            <br> ${json.data["players"]["p4"]["name"]} </br>
            <br> won: ${json.data["players"]["p4"]["won"]} </br>
            <br> lost: ${json.data["players"]["p4"]["lost"]} </br>
        </div>

        </body>
        `;

        this.setTitle("Lobby");
        this.setContent(content);
    }
}
