
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

        var content = `
        <div class="container my-4">
            <div class="row row-cols-1 row-cols-md-2 g-4">
                <div class="col">
                <div class="lobby-card1 h-100 text-center">
                        <div class="lobby-card-body">
                            <h4 class="lobby-card-title mt-1">${json.data["players"]["p1"]["name"]}</h4>
                            <p class="lobby-card-text text-success mt-4"><span class="fw-bold" style="color: #157045;">Victories: ${json.data["players"]["p1"]["won"]}</span></p>
                            <p class="lobby-card-text text-danger"><span class="fw-bold" style="color: #931024;">Defeats: ${json.data["players"]["p1"]["lost"]}</span></p>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="lobby-card2 h-100 text-center">
                        <div class="lobby-card-body">
                            <h4 class="lobby-card-title mt-1">${json.data["players"]["p2"]["name"]}</h4>
                            <p class="lobby-card-text text-success mt-4"><span class="fw-bold" style="color: #157045;">Victories: ${json.data["players"]["p2"]["won"]}</span></p>
                            <p class="lobby-card-text text-danger"><span class="fw-bold" style="color: #931024;">Defeats: ${json.data["players"]["p2"]["lost"]}</span></p>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="lobby-card3 h-100 text-center">
                        <div class="lobby-card-body">
                            <h4 class="lobby-card-title mt-1">${json.data["players"]["p3"]["name"]}</h4>
                            <p class="lobby-card-text text-success mt-4"><span class="fw-bold" style="color: #157045;">Victories: ${json.data["players"]["p3"]["won"]}</span></p>
                            <p class="lobby-card-text text-danger"><span class="fw-bold" style="color: #931024;">Defeats: ${json.data["players"]["p3"]["lost"]}</span></p>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <div class="lobby-card4 h-100 text-center">
                        <div class="lobby-card-body">
                            <h4 class="lobby-card-title mt-1">${json.data["players"]["p4"]["name"]}</h4>
                            <p class="lobby-card-text text-success mt-4"><span class="fw-bold" style="color: #157045;">Victories: ${json.data["players"]["p4"]["won"]}</span></p>
                            <p class="lobby-card-text text-danger"><span class="fw-bold" style="color: #931024;">Defeats: ${json.data["players"]["p4"]["lost"]}</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        this.setTitle("Lobby");
        this.unhideNavbar();
        await this.setContent(content);
    }
}
