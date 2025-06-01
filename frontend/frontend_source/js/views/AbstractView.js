
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

    async setContent(content)
    {
        document.querySelector("#content").style.opacity = 0;

        await new Promise(r => setTimeout(r, 400));

        document.querySelector("#content").innerHTML = content;
        document.querySelector("#content").style.opacity = 1;
    }

    hideNavbar()
    {
        if (document.getElementById("navbar").style.opacity !== 0)
        {
            document.getElementById("navbar").style.opacity = 0;
            document.getElementById("navbar").style.display = "none";
        }
    }

    unhideNavbar()
    {
        if (document.getElementById("navbar").style.opacity !== 1)
        {
            document.getElementById("navbar").style.opacity = 1;
            document.getElementById("navbar").style.display = "block";
        }
    }

    async goToView()
    {
        return;
    }

    async goToNoAuth()
    {
        var content = `
        
        <div class="container mt-5">
            <div class="first-card p-4 mx-auto" style="max-width: 400px;">
                <h3 class="text-center">Login or Register</h3>
                <form>
                    <div class="mb-3">
                        <label for="auth_user" class="form-label">Username</label>
                        <input id="auth_user" type="text" class="form-control" placeholder="Enter username" required>
                    </div>
                    <div class="mb-3">
                        <label for="auth_pwd" class="form-label">Password</label>
                        <input id="auth_pwd" type="password" class="form-control" placeholder="Enter password" required>
                    </div>
                    <div class="d-grid gap-2">
                        <button type="button" id="login" class="btn" style="background-color: #006461; color: white;">Login</button>
                        <button type="button" id="register" class="btn btn-secondary" style="background-color: #535A5F;">Register</button>
                    </div>
                </form>
            </div>
        </div>
        `

        history.replaceState({view : "lobby_view"}, null, null);
        this.hideNavbar();
        this.setTitle("Lobby");
        this.setContent(content);
    }

    async goToError()
    {
        var content = `
        <div class="container my-5">
            <div class="alert alert-danger text-center fs-5" role="alert" style="background-color: red; color: white; box-shadow: 0px 0px 5px white;">
                <strong>Error:</strong> Something went terribly wrong!!
            </div>
            </div>
        `;
        this.hideNavbar();
        await this.setContent(content);
    }

    async goToGameView()
    {
        var content = `<canvas width="900" height="600" id="pong" tabindex="-1"></canvas>`;
        
        this.hideNavbar();
        await this.setContent(content);
    }
}
