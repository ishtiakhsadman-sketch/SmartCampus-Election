/* =========================================================
   SmartCampus Election - Auth JS
   Real OTP Registration + Login
========================================================= */

let registerOtpSent = false;
let resendTimerId = null;
let resetOtpSent = false;
let resetResendTimerId = null;

document.addEventListener("DOMContentLoaded", () => {
  console.log("auth.js loaded successfully");

  setupRoleSwitcher();
  setupRegistrationWithOtp();
  setupForgotPasswordReset();
  setupLoginDemo();
});

/* -----------------------------
   Helper Functions
----------------------------- */
function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function showMessage(title, message) {
  if (typeof openModal === "function") {
    openModal(`<h2>${title}</h2><p>${message}</p>`);
  } else {
    alert(`${title}\n${message}`);
  }
}

function setOtpStatus(message) {
  const statusText = document.getElementById("otpStatusText");

  if (statusText) {
    statusText.textContent = message;
  }
}

function validateRegistrationFields() {
  const requiredFields = [
    "studentId",
    "studentName",
    "studentDepartment",
    "studentSession",
    "studentEmail",
    "studentPhone",
    "registerPassword",
    "confirmPassword"
  ];

  let isValid = true;

  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);

    if (!field) {
      console.error(`Missing field: ${fieldId}`);
      isValid = false;
      return;
    }

    if (!field.value.trim()) {
      field.classList.add("error");
      field.classList.remove("success");
      isValid = false;
    } else {
      field.classList.remove("error");
      field.classList.add("success");
    }
  });

  const password = getValue("registerPassword");
  const confirmPassword = getValue("confirmPassword");

  if (!isValid) {
    showMessage("Validation Error", "Please fill in all required fields correctly.");
    return false;
  }

  const accountTypeInput = document.querySelector('input[name="accountType"]:checked');
  const accountType = accountTypeInput ? accountTypeInput.value : 'student';

  if (accountType === 'candidate' || accountType === 'both') {
    const desiredPosition = getValue("desiredPosition");
    const manifestoText = getValue("manifestoText");
    if (!desiredPosition) {
      document.getElementById("desiredPosition").classList.add("error");
      showMessage("Validation Error", "Please select a desired position.");
      return false;
    }
    if (!manifestoText) {
      document.getElementById("manifestoText").classList.add("error");
      showMessage("Validation Error", "Please write a manifesto / short bio.");
      return false;
    }
  }

  if (password !== confirmPassword) {
    showMessage("Password Mismatch", "Password and confirm password must match.");
    return false;
  }

  if (password.length < 6) {
    showMessage("Weak Password", "Password should be at least 6 characters long.");
    return false;
  }

  return true;
}

function getRegistrationPayload() {
  const email = getValue("studentEmail");
  const accountTypeInput = document.querySelector('input[name="accountType"]:checked');
  const accountType = accountTypeInput ? accountTypeInput.value : 'student';

  // Map accountType directly to the role sent to the backend:
  // "student" → "student", "candidate" → "candidate", "both" → "both"
  const role = accountType; // preserve "both" as-is so backend stores it correctly

  return {
    studentId: getValue("studentId"),
    studentName: getValue("studentName"),
    studentDepartment: getValue("studentDepartment"),
    studentSession: getValue("studentSession"),
    studentEmail: email,
    email: email,
    studentPhone: getValue("studentPhone"),
    password: getValue("registerPassword"),
    role: role,
    accountType: accountType,
    desiredPosition: getValue("desiredPosition"),
    slogan: getValue("slogan"),
    manifesto: getValue("manifestoText"),
    achievements: getValue("achievementsText")
  };
}

function startResendCountdown(seconds) {
  const sendOtpBtn = document.getElementById("sendOtpBtn");
  if (!sendOtpBtn) return;

  let remaining = seconds || 60;

  sendOtpBtn.disabled = true;

  clearInterval(resendTimerId);

  resendTimerId = setInterval(() => {
    sendOtpBtn.textContent = `Resend OTP in ${remaining}s`;
    setOtpStatus(`OTP sent. You can request a new OTP in ${remaining} seconds.`);

    remaining--;

    if (remaining < 0) {
      clearInterval(resendTimerId);
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = "Resend OTP";
      setOtpStatus("Did not receive OTP? You can request a new OTP now.");
    }
  }, 1000);
}

/* -----------------------------
   Role Switcher
----------------------------- */
function setupRoleSwitcher() {
  const roleButtons = document.querySelectorAll(".role-btn");
  const selectedRole = document.getElementById("selectedRole");

  if (!roleButtons.length || !selectedRole) return;

  function updateLoginIdentityText(role) {
    const loginIdentityLabel = document.getElementById("loginIdentityLabel");
    const loginIdentityInput = document.getElementById("loginIdentity");

    const roleText = {
      student: {
        label: "Student ID / Email",
        placeholder: "Enter student ID or email"
      },
      candidate: {
        label: "Candidate ID / Email",
        placeholder: "Enter candidate ID or email"
      },
      admin: {
        label: "Admin ID / Email",
        placeholder: "Enter admin ID or email"
      }
    };

    const selectedText = roleText[role] || roleText.student;

    if (loginIdentityLabel) {
      loginIdentityLabel.textContent = selectedText.label;
    }

    if (loginIdentityInput) {
      loginIdentityInput.placeholder = selectedText.placeholder;
    }
  }

  function loadRememberedRoleData(role) {
    const identityInput = document.getElementById("loginIdentity");
    const passwordInput = document.getElementById("loginPassword");
    const rememberMeCheck = document.getElementById("rememberMe");

    if (!identityInput || !passwordInput || !rememberMeCheck) return;

    // Clear fields by default
    identityInput.value = "";
    passwordInput.value = "";
    rememberMeCheck.checked = false;

    const loginsStr = localStorage.getItem("smartcampus_remembered_logins");
    if (loginsStr) {
      try {
        const logins = JSON.parse(loginsStr);
        const roleData = logins[role];
        
        if (roleData && roleData.remember) {
          identityInput.value = roleData.identifier || "";
          passwordInput.value = roleData.password || ""; // DEMO ONLY
          rememberMeCheck.checked = true;
        }
      } catch (e) {
        console.error("Failed to parse remembered logins", e);
      }
    }
  }

  roleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      roleButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const newRole = button.dataset.role;
      selectedRole.value = newRole;

      updateLoginIdentityText(newRole);
      loadRememberedRoleData(newRole);
    });
  });

  const initialRole = selectedRole.value || "student";
  updateLoginIdentityText(initialRole);
  loadRememberedRoleData(initialRole);
}

/* -----------------------------
   OTP Registration
----------------------------- */
function setupRegistrationWithOtp() {
  const form = document.getElementById("registerForm");
  const sendOtpBtn = document.getElementById("sendOtpBtn");

  if (!form) return;

  if (sendOtpBtn) {
    sendOtpBtn.disabled = false;
    sendOtpBtn.textContent = "Send OTP";
  }

  form.addEventListener("submit", handleRegisterWithOtp);
}

window.handleSendRegisterOtp = async function handleSendRegisterOtp() {
  const sendOtpBtn = document.getElementById("sendOtpBtn");

  if (!validateRegistrationFields()) return;

  const payload = getRegistrationPayload();

  try {
    if (sendOtpBtn) {
      sendOtpBtn.textContent = "Sending OTP...";
      sendOtpBtn.disabled = true;
    }

    const data = await apiRequest("/auth/send-register-otp", {
      method: "POST",
      body: payload
    });

    registerOtpSent = true;

    showMessage("OTP Sent", `${data.message} Please check your email: ${payload.email}`);
    startResendCountdown(data.resendAfterSeconds || 60);
  } catch (error) {
    showMessage("OTP Failed", error.message);
    setOtpStatus("OTP could not be sent. Please check your email and try again.");
    if (sendOtpBtn) {
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = "Send OTP";
    }
  }
};

async function handleRegisterWithOtp(event) {
  event.preventDefault();

  if (!validateRegistrationFields()) return;

  const otpCode = getValue("otpCode");

  if (!registerOtpSent) {
    showMessage("OTP Required", "Please click Send OTP first and verify your email.");
    return;
  }
  if (!otpCode || !/^[0-9]{6}$/.test(otpCode)) {
    showMessage("Invalid OTP Format", "OTP must be a 6-digit number.");
    return;
  }

  const submitBtn = document.getElementById("registerSubmitBtn") || event.target.querySelector("button[type='submit']");
  const payload = { ...getRegistrationPayload(), otpCode };

  try {
    if (submitBtn) {
      submitBtn.textContent = "Verifying OTP...";
      submitBtn.disabled = true;
    }

    const data = await apiRequest("/auth/register-with-otp", { method: "POST", body: payload });
    saveAuthSession(data);
    showMessage("Registration Successful", "Your email has been verified and your account has been created.");

    const registerForm = document.getElementById("registerForm");
    if (registerForm) registerForm.reset();

    registerOtpSent = false;
    
    // Redirect based on the role returned from the server
    const userRole = (data.user && data.user.role) || payload.role;
    let redirectUrl;
    if (userRole === "candidate" || userRole === "both") {
      redirectUrl = "candidate-dashboard.html";
    } else {
      redirectUrl = "student-dashboard.html";
    }
    setTimeout(() => { window.location.href = data.redirect || redirectUrl; }, 3000);
  } catch (error) {
    showMessage("Registration Failed", error.message);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Register";
    }
  }
}

/* -----------------------------
   Forgot Password Placeholder
----------------------------- */
function setupForgotPasswordValidation() {
  const form = document.getElementById("forgotPasswordForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const resetEmail = getValue("resetEmail");
    const resetOtp = getValue("resetOtp");
    const newPassword = getValue("newPassword");
    const confirmNewPassword = getValue("confirmNewPassword");

    if (!newPassword || !confirmNewPassword || newPassword !== confirmNewPassword) {
      showMessage("Error", "Please fill in valid and matching new passwords.");
      return;
    }

    try {
      await apiRequest("/auth/forgot-password-placeholder", {
        method: "POST", body: { identity: resetEmail, otp: resetOtp, newPassword }
      });
      showMessage("Password Reset Placeholder", "Your password reset request was accepted.");
      form.reset();
    } catch (error) {
      showMessage("Reset Failed", error.message);
    }
  });
}

function setResetOtpStatus(message) {
  const statusText = document.getElementById("resetOtpStatusText");
  if (statusText) statusText.textContent = message;
}

function startResetResendCountdown(seconds) {
  const sendResetOtpBtn = document.getElementById("sendResetOtpBtn");
  if (!sendResetOtpBtn) return;

  let remaining = seconds || 60;
  sendResetOtpBtn.disabled = true;
  clearInterval(resetResendTimerId);

  resetResendTimerId = setInterval(() => {
    sendResetOtpBtn.textContent = `Resend OTP in ${remaining}s`;
    setResetOtpStatus(`OTP sent. You can request a new OTP in ${remaining} seconds.`);
    remaining--;

    if (remaining < 0) {
      clearInterval(resetResendTimerId);
      sendResetOtpBtn.disabled = false;
      sendResetOtpBtn.textContent = "Resend OTP";
      setResetOtpStatus("Did not receive OTP? You can request a new OTP now.");
    }
  }, 1000);
}

function setupForgotPasswordReset() {
  const form = document.getElementById("forgotPasswordForm");
  const sendResetOtpBtn = document.getElementById("sendResetOtpBtn");
  if (!form) return;

  if (sendResetOtpBtn) {
    sendResetOtpBtn.disabled = false;
    sendResetOtpBtn.textContent = "Send OTP";
  }
  form.addEventListener("submit", handleResetPasswordWithOtp);
}

window.handleSendResetOtp = async function handleSendResetOtp() {
  const identity = getValue("resetEmail");
  const sendResetOtpBtn = document.getElementById("sendResetOtpBtn");

  if (!identity) {
    showMessage("Missing Information", "Please enter your registered email or student ID.");
    return;
  }

  try {
    if (sendResetOtpBtn) {
      sendResetOtpBtn.textContent = "Sending OTP...";
      sendResetOtpBtn.disabled = true;
    }
    const data = await apiRequest("/auth/send-reset-otp", { method: "POST", body: { identity } });
    resetOtpSent = true;
    showMessage("OTP Sent", data.message);
    startResetResendCountdown(data.resendAfterSeconds || 60);
  } catch (error) {
    showMessage("OTP Failed", error.message);
    setResetOtpStatus("OTP could not be sent.");
    if (sendResetOtpBtn) {
      sendResetOtpBtn.disabled = false;
      sendResetOtpBtn.textContent = "Send OTP";
    }
  }
};

async function handleResetPasswordWithOtp(event) {
  event.preventDefault();
  const identity = getValue("resetEmail");
  const otpCode = getValue("resetOtp");
  const newPassword = getValue("newPassword");
  const confirmNewPassword = getValue("confirmNewPassword");
  const submitBtn = document.getElementById("resetPasswordSubmitBtn");

  if (!identity || !otpCode || !newPassword || newPassword !== confirmNewPassword || newPassword.length < 6) {
    showMessage("Error", "Please fill out all fields correctly.");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.textContent = "Resetting Password...";
      submitBtn.disabled = true;
    }
    const data = await apiRequest("/auth/reset-password-with-otp", {
      method: "POST", body: { identity, otpCode, newPassword, confirmNewPassword }
    });
    showMessage("Success", data.message);
    document.getElementById("forgotPasswordForm")?.reset();
    resetOtpSent = false;
    setTimeout(() => { window.location.href = "login.html"; }, 3000);
  } catch (error) {
    showMessage("Failed", error.message);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Reset Password";
    }
  }
}

/* -----------------------------
   Login
----------------------------- */
function setupLoginDemo() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  // Clean up legacy shared local storage key to prevent conflicts
  localStorage.removeItem("smartcampus_remembered_login");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const identity = getValue("loginIdentity");
    const password = getValue("loginPassword");
    const role = getValue("selectedRole");

    if (!identity || !password) {
      showMessage("Login Error", "Please enter your ID/email and password.");
      return;
    }

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: { identity, password, role }
      });

      saveAuthSession(data);

      // --- Remember Me Save Logic (Role-Specific) ---
      const rememberMeCheck = document.getElementById("rememberMe");
      const loginsStr = localStorage.getItem("smartcampus_remembered_logins");
      let logins = {};
      try {
        if (loginsStr) logins = JSON.parse(loginsStr);
      } catch (e) {}

      if (rememberMeCheck && rememberMeCheck.checked) {
        // DEMO ONLY: Storing the password locally
        logins[role] = {
          remember: true,
          identifier: identity,
          password: password // NOT FOR PRODUCTION
        };
      } else {
        // Unchecked: remove ONLY the current role's saved data
        delete logins[role];
      }
      localStorage.setItem("smartcampus_remembered_logins", JSON.stringify(logins));

      // Purge old non-scoped global vote keys so this fresh login
      // is never falsely blocked by a previous student's vote state.
      localStorage.removeItem("smartcampus_vote_submitted");
      localStorage.removeItem("smartcampus_vote_timestamp");
      localStorage.removeItem("smartcampus_ballot_selections");

      // For "both" role users, track WHICH context they logged in as
      // so that student pages vs candidate pages show correctly
      const loginAs = data.loginAs || (data.user && data.user.role) || role;
      localStorage.setItem("smartcampus_login_as", loginAs);

      const displayRole = loginAs === "both" ? role : loginAs;
      showMessage("Login Successful", `You have logged in as ${displayRole}.`);
      form.reset();

      // Use server-provided redirect (which is already tab-aware for "both" users)
      // Fall back to client-side logic as safety net
      let redirectUrl = data.redirect;
      if (!redirectUrl) {
        if (data.user && data.user.role === "both") {
          redirectUrl = (role === "candidate") ? "candidate-dashboard.html" : "student-dashboard.html";
        } else {
          redirectUrl = "student-dashboard.html";
        }
      }

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    } catch (error) {
      showMessage("Login Failed", error.message);
    }
  });
}