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

	<p> Statistics View </p>
	`;

	this.setTitle("Statistics");
	this.unhideNavbar();
	await this.setContent(content);
    }
}

