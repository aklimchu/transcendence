import AbstractView from "./AbstractView.js";
import { authFetch } from "../auth.js";

export default class extends AbstractView
{
	constructor(params)
	{
	super(params);
	}

	async fetchStatsData()
	{
		try
		{
			const response = await authFetch("pong_api/pong_stats_data/", {method: "GET"});
			
			if (!response) {
				this.goToNoAuth("Session expired. Please log in again.");
				return;
			}
			if (!response.ok) {
				this.goToError();
				return;
			}
			return await response.json();
		}
		catch(err)
		{
//			console.error(err.message);
			if (err.message === "No response from server")
				this.goToNoAuth("Session expired. Please log in again.");
			else
				this.goToError();
			throw err;
		}
	}

    async goToView()
    {
        let json;
        try {
            json = await this.fetchStatsData();
            if (!json || !json.data) {
                await this.goToNoAuth("Session expired. Please log in again.");
                return;
            }
        } catch (err) {
            await this.goToNoAuth("Session expired. Please log in again.");
            return;
        }

	console.log(json)

	var content = `
	<div class="container mb-5">
		<div class="stats-card">
			<div class="card-body text-center" style="padding: 20px;">
				<h4 class="card-title mb-3" style="color: #005252;">📊 Statistics</h4>
				<p class="card-text"><span class="fw-bold" style="color: #005252;">Total games played:</span> ${json.data["total_games"]}</p>
				<p class="card-text"><span class="fw-bold" style="color: #005252;">Registered users:</span> ${json.data["user_names"]}</p>
			</div>
		</div>
	</div>
	`;

	this.setTitle("Statistics");
	this.unhideNavbar();
	await this.setContent(content);
	}
}
