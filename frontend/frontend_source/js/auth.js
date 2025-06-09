export function getCookie(name) {
	let cookieValue = null;
	if (document.cookie && document.cookie !== '') {
		const cookies = document.cookie.split(';');
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].trim();
			if (cookie.substring(0, name.length + 1) === (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}

export async function register_func(user, pwd) {
	try {
		const response = await authFetch("/pong_api/pong_register/", {
			method: "POST",
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username: user, password: pwd })
		});

		if (!response) {
			showErrorMessage("No response from server. Please try again.", 0);
			return false;
		}
		if (!response.ok) {
			let errorMsg = "Registration failed. Please try again.";
			try {
				const errorData = await response.json();
				if (errorData && errorData.error)
					errorMsg = errorData.error;
			} catch {}
			showErrorMessage(errorMsg, 0);
			return false;
		}
		showSuccessMessage("Registration successful! Logging in...", 0);
		return true;
	} catch (err) {
		console.error(err.message);
		return false;
	}
}

export async function login_func(user, pwd) {
	const response = await authFetch("/api/token/", {
		method: "POST",
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username: user, password: pwd })
	});

	if (!response) {
		showErrorMessage("No response from server. Please try again.", 0);
		return false;
	}
	if (!response.ok) {
		let errorMsg = "Login failed. Please check your credentials.";
		try {
			const errorData = await response.json();
			if (errorData && errorData.detail)
				errorMsg = errorData.detail;
		} catch {}
		showErrorMessage(errorMsg, 0);
		return false;
	}

	const data = await response.json();
	localStorage.setItem("access", data.access);
	localStorage.setItem("refresh", data.refresh);
	showSuccessMessage("Login successful! Welcome!", 0);
	return true;
}

export async function logout_func() {
	const refresh = localStorage.getItem("refresh");
	let response;
	if (refresh) {
		response = await authFetch("/api/token/blacklist/", {
			method: "POST",
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refresh: refresh })
		});
	}

	localStorage.removeItem("access");
	localStorage.removeItem("refresh");

	if (!refresh) {
		showErrorMessage("Session expired. Please log in again.", 0);
		setTimeout(() => window.location.href = "/login", 2000);
		return false;
	}

	if (!response || !response.ok) {
		showErrorMessage("Failed to log out from server, but local session cleared.", 0);
	} else {
		showSuccessMessage("Logged out successfully.", 1);
	}
	setTimeout(() => window.location.href = "/login", 1000);
	return true;
}

function showErrorMessage(message, index) {
	const alertBox = document.getElementById("error-alert");
	const errorMessage = document.getElementById("error-message");
	if (!alertBox || !errorMessage) return;
	errorMessage.innerHTML = message;
	alertBox.style.display = "block";
	if (index !== 2) {
		alertBox.style.backgroundColor = "red";
		alertBox.style.color = "orange";
		alertBox.style.borderRadius = "14px";
		alertBox.style.boxShadow = "0px 0px 20px white";
		alertBox.style.zIndex = 1000;
		alertBox.style.display = "flex";
		alertBox.style.justifyContent = "center";
		alertBox.style.alignItems = "center";
		alertBox.style.textAlign = "center";
		let verticalPosition;
		if (index === 0)
			verticalPosition = "62.5%";
		else if (index === 1)
			verticalPosition = "58%";
		else
			verticalPosition = "50%";
		alertBox.style.top = verticalPosition;
		alertBox.style.left = "50%";
		alertBox.style.transform = "translateX(-50%)";
		alertBox.style.width = "282px";
		alertBox.style.height = "60px";
		alertBox.style.cursor = "pointer";
		alertBox.style.fontSize = "20px";
	}
	alertBox.classList.add("show");
	setTimeout(() => {
		alertBox.classList.remove("show");
		alertBox.style.display = "none";
	}, 3000);
}

function showSuccessMessage(message, index) {
	const alertBox = document.getElementById("error-alert");
	const errorMessage = document.getElementById("error-message");
	if (!alertBox || !errorMessage) return;
	errorMessage.innerHTML = message;
	alertBox.style.display = "block";
	if (index !== 2) {
		alertBox.style.backgroundColor = "green";
		alertBox.style.color = "white";
		alertBox.style.borderRadius = "14px";
		alertBox.style.boxShadow = "0px 0px 20px white";
		alertBox.style.zIndex = 1000;
		alertBox.style.display = "flex";
		alertBox.style.justifyContent = "center";
		alertBox.style.alignItems = "center";
		alertBox.style.textAlign = "center";
		let verticalPosition;
		if (index === 0)
			verticalPosition = "62.5%";
		else if (index === 1)
			verticalPosition = "58%";
		else
			verticalPosition = "50%";
		alertBox.style.top = verticalPosition;
		alertBox.style.left = "50%";
		alertBox.style.transform = "translateX(-50%)";
		alertBox.style.width = "282px";
		alertBox.style.height = "60px";
		alertBox.style.cursor = "pointer";
		alertBox.style.fontSize = "20px";
	}
	alertBox.classList.add("show");
	setTimeout(() => {
		alertBox.classList.remove("show");
		alertBox.style.display = "none";
	}, 3000);
}

export async function authFetch(url, options = {}) {
	let access = localStorage.getItem('access');
	options.headers = options.headers || {};
	if (access)
		options.headers['Authorization'] = `Bearer ${access}`;
	if (!url.startsWith("/")) url = "/" + url;
	let response = await fetch(url, options);

	if (response.status === 401 && localStorage.getItem('refresh')) {
		const refreshResponse = await fetch('/api/token/refresh/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refresh: localStorage.getItem('refresh') })
		});
		if (refreshResponse.ok) {
			const data = await refreshResponse.json();
			localStorage.setItem('access', data.access);
			options.headers['Authorization'] = `Bearer ${data.access}`;
			response = await fetch(url, options);
		} else {
			localStorage.removeItem('access');
			localStorage.removeItem('refresh');
			showErrorMessage("Session expired. Please log in again.", 0);
			setTimeout(() => window.location.href = "/login", 2000);
			return null;
		}
	}
	return response;
}
