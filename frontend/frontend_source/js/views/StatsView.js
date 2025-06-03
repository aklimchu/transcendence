import AbstractView from "./AbstractView.js";


export default class extends AbstractView
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
        const players = json.data["players"];
        if (!players || !players["p1"]) {
            console.error("Player stats not found in response:", json);
            this.goToError();
            return;
        }
        const content = `
        <div class="stats-container my-2">
            <div class="stats-card text-center">
                <h3 class="text-center mb-3" style="color: #005252;">🏓Player Performance Overview🐍</h3>
                <div class="row row-cols-1 row-cols-md-2 g-4">
                    <div class="col"><canvas id="chartP1"></canvas></div>
                    <div class="col"><canvas id="chartP2"></canvas></div>
                    <div class="col"><canvas id="chartP3"></canvas></div>
                    <div class="col"><canvas id="chartP4"></canvas></div>
                </div>
            </div>
        </div>
        `;
        this.setTitle("Statistics");
        this.unhideNavbar();
        await this.setContent(content);
        function createChart(id, player) {
            const ctx = document.getElementById(id).getContext('2d');
            new Chart(ctx, {
                type: 'pie', /* 'doughnut' can also be used */
                data: {
                    labels: ['Victories', 'Defeats'],
                    datasets: [{
                        data: [player.won, player.lost],
                        backgroundColor: ['#157045', '#931024'],
                        borderColor: '#fff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: `${player.name}`,
                            font: { size: 17 },
                            color: '#005252'
                        },
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { size: 15 },
                                color: '#005252'
                            }
                        }
                    }
                }
            });
        }
        createChart("chartP1", players["p1"]);
        createChart("chartP2", players["p2"]);
        createChart("chartP3", players["p3"]);
        createChart("chartP4", players["p4"]);
    }
}
