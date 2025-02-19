
export default class
{
    constructor(params)
    {
        this.params = params;
    }

    async fetchSessionData()
    {
        try
        {
            var response = await fetch("pong_api/pong_session_data/", {method: "GET"});
            if (!response.ok)
                throw new Error("Failed to fetch session data");
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

    setTitle(title)
    {
        document.title = title;
    }

    setContent(content)
    {
        document.querySelector("#content").innerHTML = content;
    }

    async goToView()
    {
        return;
    }

    async goToNoAuth()
    {
        var content = `
        
        <div class="auth-form">
            <h3> Login or register </h3>
            <form>
            <br> <input id="auth_user" type="text" title="username" placeholder="username" maxlength="42" required/> </br>
            <br> <input id="auth_pwd" type="password" title="username" placeholder="password" maxlength="42" required/> </br>
            </form>
            <br> <button id="login"> Login </button> <button id="register"> Register </button> </br>
        </div>
        `

        history.replaceState({view : "lobby_view"}, null, null);
        this.setTitle("Lobby");
        this.setContent(content);
    }

    async goToError()
    {
        var content = `Something went terribly worng!`

        this.setContent(content);
    }
}