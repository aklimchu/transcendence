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
			let errorMsg = `Registration failed (${response.status}).`;
			try {
				const errorData = await response.json();
				if (errorData && errorData.error)
					errorMsg = `Registration failed: ${errorData.error} (${response.status})`;
				else if (errorData && errorData.detail)
					errorMsg = `Registration failed: ${errorData.detail} (${response.status})`;
			} catch (e) {
				errorMsg += " (Could not parse error details)";
			}
			showErrorMessage(errorMsg, 0);
			return false;
		}
		showSuccessMessage("Registration successful! Logging in...", 0);

		await new Promise(resolve => setTimeout(resolve, 750));

		const data = await response.json();		
		const loginResult = await login_func(user, pwd);
		return loginResult;
	} catch (err) {
		showErrorMessage(`Registration error: ${err.message}`, 0);
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
		setTimeout(() => { if (typeof router === "function") router(null);}, 1000);
		return false;
	}

	if (!response || !response.ok) {
		showErrorMessage("Failed to log out from server, but local session cleared.", 0);
	} else {
		showSuccessMessage("Logged out successfully.", 0);
	}
	setTimeout(() => { if (typeof router === "function") router(null);}, 2000);
	return true;
}

let errorAlertTimeout = null;
let successAlertTimeout = null;

function showErrorMessage(message, index) {
	console.log("showErrorMessage:", message);
	const alertBox = document.getElementById("error-alert");
	const errorMessage = document.getElementById("error-message");
	if (!alertBox || !errorMessage) return;

	if (errorAlertTimeout) clearTimeout(errorAlertTimeout);

	alertBox.classList.remove("fade", "show");
	alertBox.style.display = "block";
	void alertBox.offsetWidth;

	errorMessage.innerHTML = message;

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
		alertBox.style.minWidth = "200px";
		alertBox.style.maxWidth = "90vw";
		alertBox.style.padding = "16px";
		alertBox.style.wordBreak = "break-word";
		alertBox.style.whiteSpace = "pre-line";
		alertBox.style.cursor = "pointer";
		alertBox.style.fontSize = "20px";
	}

	alertBox.classList.add("fade", "show");

	errorAlertTimeout = setTimeout(() => {
		alertBox.classList.remove("show");
		alertBox.style.display = "none";
	}, 3000);

	const closeButton = alertBox.querySelector(".btn-close");
	if (closeButton) {
		closeButton.onclick = () => {
			alertBox.classList.remove("show");
			alertBox.style.display = "none";
			if (errorAlertTimeout) clearTimeout(errorAlertTimeout);
		};
	}
}

function showSuccessMessage(message, index) {
	console.log("showSuccessMessage:", message);
	const alertBox = document.getElementById("success-alert");
	const errorMessage = document.getElementById("success-message");
	if (!alertBox || !errorMessage) return;

	if (successAlertTimeout) clearTimeout(successAlertTimeout);

	alertBox.classList.remove("fade", "show");
	alertBox.style.display = "block";
	void alertBox.offsetWidth;

	errorMessage.innerHTML = message;

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
			verticalPosition = "22.5%";
		else if (index === 1)
			verticalPosition = "58%";
		else
			verticalPosition = "50%";
		alertBox.style.top = verticalPosition;
		alertBox.style.left = "50%";
		alertBox.style.transform = "translateX(-50%)";
		alertBox.style.minWidth = "200px";
		alertBox.style.maxWidth = "90vw";
		alertBox.style.padding = "16px";
		alertBox.style.wordBreak = "break-word";
		alertBox.style.whiteSpace = "pre-line";
		alertBox.style.cursor = "pointer";
		alertBox.style.fontSize = "20px";
	}

	alertBox.classList.add("fade", "show");

	successAlertTimeout = setTimeout(() => {
		alertBox.classList.remove("show");
		alertBox.style.display = "none";
	}, 3000);

	const closeButton = alertBox.querySelector(".btn-close");
	if (closeButton) {
		closeButton.onclick = () => {
			alertBox.classList.remove("show");
			alertBox.style.display = "none";
			if (successAlertTimeout) clearTimeout(successAlertTimeout);
		};
	}
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
			setTimeout(() => { if (typeof router === "function") router(null);}, 1000);
			return null;
		}
	}
	return response;
}
