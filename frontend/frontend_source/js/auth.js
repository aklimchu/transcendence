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
		showSuccessMessage("User registered successfully! Please scan the QR code with your Authenticator app to enable 2FA.", 1);

		await new Promise(resolve => setTimeout(resolve, 750));

		if (response.ok) {
			const data = await response.json();
		const qr = document.getElementById("twofa-qr");
			qr.src = "data:image/png;base64," + data.qr_code;
			qr.style.display = "block";
		}
		} catch (err) {
		showErrorMessage(`Registration error: ${err.message}`, 0);
		return false;
	}

}

export async function login_func(user, pwd) {
	let token = prompt("Enter your 2FA code from your Authenticator app (leave blank if not enabled):") || "";

	const response = await authFetch("/pong_api/login_with_2fa/", {
		method: "POST",
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username: user, password: pwd, token: token })
	});

	if (!response.ok) {
		let errorMsg = `Login failed (${response.status}).`;
		try {
			const errorData = await response.json();
			if (errorData && errorData.error)
				errorMsg = `Login failed: ${errorData.error} (${response.status})`;
			else if (errorData && errorData.detail)
				errorMsg = `Login failed: ${errorData.detail} (${response.status})`;
		} catch (e) {
			errorMsg += " (Could not parse error details)";
		}
		showErrorMessage(errorMsg, 0);
		return false;
	}

	const data = await response.json();
	localStorage.setItem("access", data.access);
	localStorage.setItem("refresh", data.refresh);
	showSuccessMessage("Login successful!", 0);
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
	if (access) {
		options.headers['Authorization'] = `Bearer ${access}`;
	}
	if (!url.startsWith("/")) url = "/" + url;
	let response = await fetch(url, options);

	if (response.status === 401) {
		if (access) {
			localStorage.removeItem('access');
			localStorage.removeItem('refresh');
			showErrorMessage("Session expired. Please log in again.", 0);
			if (typeof router === "function") {
				router(null);
			} else {
				window.location.reload();
			}
		}
		return null;
	}
	return response;
}

export async function handleCredentialResponse(response) {
	localStorage.removeItem("access");
	localStorage.removeItem("refresh");

	let name = null, picture = null, email = null;
	try {
		const base64Url = response.credential.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));
		const payload = JSON.parse(jsonPayload);
		name = payload.name;
		picture = payload.picture;
		email = payload.email;
	} catch (e) {
		console.warn("Could not decode Google ID token", e);
	}

	const responseData = await authFetch("/pong_api/google_login/", {
		method: "POST",
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ credential: response.credential, name, picture, email })
	});

	if (!responseData || !responseData.ok) {
		let errorMsg = `Google login failed (${responseData ? responseData.status : "no response"}).`;
		try {
			const errorData = responseData ? await responseData.json() : null;
			if (errorData && errorData.error)
				errorMsg = `Google login failed: ${errorData.error} (${responseData.status})`;
			else if (errorData && errorData.detail)
				errorMsg = `Google login failed: ${errorData.detail} (${responseData.status})`;
		} catch (e) {
			errorMsg += " (Could not parse error details)";
		}
		showErrorMessage(errorMsg, 0);
		return false;
	}

	let data = await responseData.json();

	if (data["2fa_required"]) {
		const code = prompt("2FA is enabled. Please enter your 2FA code:");
		if (!code) {
			showErrorMessage("2FA code required to complete login.", 0);
			return false;
		}
		const verifyResp = await authFetch("/pong_api/2fa/verify/", {
			method: "POST",
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ user_id: data.user_id, totp: code })
		});
		if (!verifyResp || !verifyResp.ok) {
			showErrorMessage("Invalid 2FA code.", 0);
			return false;
		}
		const verifyData = await verifyResp.json();
		if (verifyData.access && verifyData.refresh) {
			localStorage.setItem("access", verifyData.access);
			localStorage.setItem("refresh", verifyData.refresh);
			showSuccessMessage("Login successful!", 0);
			if (data.is_new_user) {
				let password = null;
				while (!password) {
					password = prompt("Welcome! Please create a password for your account:");
					if (password === null) {
						showErrorMessage("Password creation is required to complete registration.", 0);
						return false;
					}
				}
				const formData = new FormData();
				formData.append("password", password);
				const pwdResp = await authFetch("/pong_api/pong_settings/update/", {
					method: "POST",
					body: formData
				});
				if (!pwdResp || !pwdResp.ok) {
					showErrorMessage("Failed to set password. Please try again.", 0);
					return false;
				}
				showSuccessMessage("Password set successfully!", 0);
			}
			if (typeof router === "function") {
				router(null);
			} else {
				window.location.reload();
			}
			return true;
		} else {
			showErrorMessage("2FA verification failed.", 0);
			return false;
		}
	}

	if (data.access && data.refresh) {
		localStorage.setItem("access", data.access);
		localStorage.setItem("refresh", data.refresh);
		showSuccessMessage("Login successful!", 0);
		if (data.is_new_user) {
			let password = null;
			while (!password) {
				password = prompt("Welcome! Please create a password for your account:");
				if (password === null) {
					showErrorMessage("Password creation is required to complete registration.", 0);
					return false;
				}
			}
			const formData = new FormData();
			formData.append("password", password);
			const pwdResp = await authFetch("/pong_api/pong_settings/update/", {
				method: "POST",
				body: formData
			});
			if (!pwdResp || !pwdResp.ok) {
				showErrorMessage("Failed to set password. Please try again.", 0);
				return false;
			}
			showSuccessMessage("Password set successfully!", 0);
		}
		if (typeof router === "function") {
			router(null);
		} else {
			window.location.reload();
		}
		return true;
	} else {
		showErrorMessage("Login failed.", 0);
		return false;
	}
}