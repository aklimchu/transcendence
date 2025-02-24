import AbstractView from "./AbstractView.js";

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
            var response = await fetch("pong_api/pong_stats_data/", {method: "GET"});
            if (!response.ok)
                throw new Error("Failed to fetch statistics data");
            return await response.json();
        }
        catch(err)
        {
            console.error(err.message);
            if (response.status === 401)
                this.goToNoAuth();
            else
                this.goToError();
            throw err;
        }
    }

    async goToView()
    {
	try {var json = await this.fetchStatsData();}
	catch (err) {return;}

	console.log(json)

	var content = `
	<p> Statistics View </p>
	<p>Total games played: ${json.data["total_games"]}</p>
	`;

	this.setTitle("Statistics");
	this.unhideNavbar();
	await this.setContent(content);
    }
}

