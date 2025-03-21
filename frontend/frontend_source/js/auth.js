

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
        showErrorMessage("Failed. Try again!", 0);
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
        showErrorMessage("Failed. Try again!", 1);
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

        if (!response.ok) {throw new Error("Failed to logout. Try again!!");}
        return true
    }
    catch(err)
    {
        console.error(err.message);
        showErrorMessage("Failed! Try again.", 2);
        return false;
    }
};

function showErrorMessage(message, index) {
    const alertBox = document.getElementById("error-alert");
    const errorMessage = document.getElementById("error-message");
    errorMessage.innerHTML = message;
    alertBox.style.display = "block";
    if (index !=2)
    {
        alertBox.style.backgroundColor = "red";
        alertBox.style.color = "orange";
        alertBox.style.borderRadius = "15px";
        alertBox.style.boxShadow = "0px 0px 20px white";
        alertBox.style.position = "fixed";
        alertBox.style.zIndex = 1000;
        alertBox.style.display = "flex";
        alertBox.style.justifyContent = "center";
        alertBox.style.alignItems = "center";
        alertBox.style.textAlign = "center"; 
        if (index == 0)
            alertBox.style.top = "620px";  //register
        else if (index == 1)
            alertBox.style.top = "560px";  //login
        alertBox.style.width = "280px";
        alertBox.style.height = "60px";
        alertBox.style.left = "42.8%";
        alertBox.style.cursor = "pointer";
        alertBox.style.fontSize = "20px";
    }
        alertBox.classList.add("show");
    setTimeout(() => {
        alertBox.classList.remove("show");
        alertBox.style.display = "none";
    }, 2000);
}
