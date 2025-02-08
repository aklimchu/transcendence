import AbstractView from "./Base_view.js";

export default class extends AbstractView
{
    constructor(params)
    {
        super(params);
        this.setTitle("Login");
    }

    async getHtml(pong_auth)
    {
        if (pong_auth)
            return `<h2>Already logged in!</h2>`

        return `
        <body style="background-color:powderblue;">

        <div class="log-form">
            <h2>Login to your account</h2>
            <form>
            <br> <input id="login_user" type="text" title="username" placeholder="username" maxlength="42" required/> </br>
            <br> <input id="login_pwd" type="password" title="username" placeholder="password" maxlength="42" required/> </br>
            </form>
            <br> <button type="submit" class="btn" onclick="login_button()">Login</button> </br>
        </div>

        </body>
        `;
    }
}