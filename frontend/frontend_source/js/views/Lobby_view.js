import AbstractView from "./Base_view.js";

export default class extends AbstractView
{
    constructor(params)
    {
        super(params);
        this.setTitle("Lobby");
    }

    async getHtml()
    {
        var response = await fetch("pong_api/pong_player_data/", {method: "GET"});
        var json = await response.json()

        return `
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

        <div id="div1"> ${json.data[0]} </div>

        <div id="div2"> ${json.data[1]} </div>

        <div id="div3"> ${json.data[2]} </div>

        <div id="div4"> ${json.data[3]} </div>

        </body>
        `;
    }
}
