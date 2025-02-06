import AbstractView from "./Base_view.js";

export default class extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Game");
    }

    async getHtml() {
        return `
            <body>
                <canvas width="900" height="600" id="pong"></canvas>
                <br> <button type="submit" class="btn" onclick="play_pong()">Play pong</button> </br>
            </body>
        `;
    }
}