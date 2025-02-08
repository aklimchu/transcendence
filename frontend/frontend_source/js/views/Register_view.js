import AbstractView from "./Base_view.js";

export default class extends AbstractView
{
    constructor(params)
    {
        super(params);
        this.setTitle("Register");
    }

    async getHtml()
    {
        return `
            <body style="background-color:powderblue;">

            <div class="register-form">
                <h2>Register account</h2>
                <form>
                <br> <input id="register_user" type="text" title="username" placeholder="username" maxlength="42" required/> </br>
                <br> <input id="register_pwd" type="password" title="username" placeholder="password" maxlength="42" required/> </br>
                </form>
                <br> <button type="submit" class="btn" onclick="register_button()">Register</button> </br>
            </div>

            </body>
        `;
    }
}