
async function login_button()
{
    await login_func
    (
      document.getElementById("login_user").value,
      document.getElementById("login_pwd").value
    );
};

async function login_func(user, pwd)
{
    try
    {
        const response = await fetch("pong_api/pong_login/", {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username: user, password: pwd})});

        if (!response.ok) {throw new Error("Failed to login");}
    }
    catch (error) {console.error(error.message);}
};