export default class
{
    constructor(params)
    {
        this.params = params;
    }

    setTitle(title)
    {
        document.title = title;
    }

    async goToView()
    {
        return;
    }

    async goToNoAuthView()
    {
        this.setTitle("Lobby");
        history.replaceState({view : "lobby_view"}, null, null);

        document.querySelector("#app").innerHTML = `
        
        <div class="log-form">
            <h3>Login to your account</h3>
            <form>
            <br> <input id="login_user" type="text" title="username" placeholder="username" maxlength="42" required/> </br>
            <br> <input id="login_pwd" type="password" title="username" placeholder="password" maxlength="42" required/> </br>
            </form>
            <br> <button id="login"> Login </button> </br>
        </div>

        <br></br>
        
        <div class="register-form">
            <h3>Register account</h3>
            <form>
            <br> <input id="register_user" type="text" title="username" placeholder="username" maxlength="42" required/> </br>
            <br> <input id="register_pwd" type="password" title="username" placeholder="password" maxlength="42" required/> </br>
            </form>
            <br> <button id="register"> Register </button> </br>
        </div>
        `
    }
}