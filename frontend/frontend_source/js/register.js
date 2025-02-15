
const register_button = async () =>
{
    await register_func
    (
      document.getElementById("register_user").value,
      document.getElementById("register_pwd").value
    );
};

const register_func = async (user, pwd) => 
{
    try
    {
        const response = await fetch("pong_api/pong_register/", {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username: user, password: pwd,})});

        if (!response.ok) {throw new Error("Failed to register");}
    }

    catch (error) {console.error(error.message);}
};