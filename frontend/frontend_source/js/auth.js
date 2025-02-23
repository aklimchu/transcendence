

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
        console.error(err.message);
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
        console.error(err.message);
        return false;
    }
};

function getCookie(name)
{
    let cookieValue = null;
    if (document.cookie && document.cookie !== '')
    {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++)
        {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '='))
            {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


async function logout_func()
{
    try
    {
        const response = await fetch("pong_api/pong_logout/", {method: "POST", headers: {'X-CSRFToken': getCookie('csrftoken')}});

        if (!response.ok) {throw new Error("Failed to logout");}
        return true
    }
    catch(err)
    {
        console.error(err.message);
        return false;
    }
};