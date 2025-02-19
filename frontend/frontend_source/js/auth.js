

async function register_func(user, pwd)
{
    try
    {
        const response = await fetch("pong_api/pong_register/", {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username: user, password: pwd,})});

        if (!response.ok) {throw new Error("Failed to register");}
        return true;
    }
    catch(err)
    {
        console.err(err.message);
        return false;
    }
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
        return true
    }
    catch(err)
    {
        console.err(err.message);
        return false;
    }
};