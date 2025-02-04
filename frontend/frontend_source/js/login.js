
const login_button = async () =>
{
    await login_func
    (
      document.getElementById("login_user").value,
      document.getElementById("login_pwd").value
    );
};

const login_func = async (user, pwd) => 
{
    try
    {
        const response = await fetch("pong_api/pong_login/", {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username: user, password: pwd,})});

        if (!response.ok) {throw new Error("Failed to login");}
    
        const json = await response.json();
    }

    catch (error) {console.error(error.message);}
};