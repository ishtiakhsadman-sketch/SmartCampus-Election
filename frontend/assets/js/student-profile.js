/* =========================================================
   SmartCampus Election - Student Profile JS
   Fix: Fetches true user profile from backend via JWT.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setupStudentProfilePage();
});

async function setupStudentProfilePage() {
  if (!requireLogin(["student"])) return;

  // 1. Fetch real user data from backend
  try {
    const response = await apiRequest("/auth/me", { method: "GET" });
    if (response.success && response.user) {
      fillStudentProfileForm(response.user);
      updateAvatarPreview(response.user.name || response.user.fullName || response.user.email);
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    showStudentProfileMessage("Error", "Failed to load profile data.");
  }

  // 2. Setup form submission
  const form = getElementByPossibleIds(["studentProfileForm", "profileForm", "studentForm"]);
  
  if (form && !form.dataset.profileHandlerAttached) {
    form.dataset.profileHandlerAttached = "true";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const profileData = {
        fullName: getInputValue(["profileFullName", "fullName", "studentName"]),
        department: getInputValue(["profileDepartment", "studentDepartment", "department"]),
        session: getInputValue(["profileSession", "studentSession", "session"]),
        email: getInputValue(["profileEmail", "studentEmail", "email"]),
        phone: getInputValue(["profilePhone", "studentPhone", "phone"])
      };

      try {
        const updateRes = await apiRequest("/student/profile", {
          method: "PUT",
          body: profileData
        });

        if (updateRes.success && updateRes.user) {
          // Update local auth cache to reflect changes
          updateAuthUserWithProfile(updateRes.user);
          
          // Re-render navbar and avatar
          if (typeof renderPublicNavAuth === "function") {
            renderPublicNavAuth();
          }
          updateAvatarPreview(updateRes.user.name);

          showStudentProfileMessage("Profile Saved", "Your profile has been updated successfully.");
        }
      } catch (error) {
        console.error("Error saving profile:", error);
        showStudentProfileMessage("Update Failed", "Failed to save profile. Please try again.");
      }
    });
  }
}

/* ================= Profile Helpers ================= */

function fillStudentProfileForm(user) {
  setInputValue(["profileStudentId", "studentId", "studentProfileId"], user.studentId || "");
  setInputValue(["profileFullName", "fullName", "studentName"], user.name || user.fullName || "");
  setInputValue(["profileDepartment", "studentDepartment", "department"], user.department || "");
  setInputValue(["profileSession", "studentSession", "session"], user.session || "");
  setInputValue(["profileEmail", "studentEmail", "email"], user.email || "");
  setInputValue(["profilePhone", "studentPhone", "phone"], user.phone || user.mobile || "");

  // Prevent modifying Student ID (it's unique/primary)
  const idInput = getElementByPossibleIds(["profileStudentId", "studentId", "studentProfileId"]);
  if (idInput) {
    idInput.disabled = true;
    idInput.style.backgroundColor = "#f5f5f5";
  }
}

function updateAvatarPreview(name) {
  const avatarImg = document.getElementById("profileAvatarPreview");
  if (!avatarImg || !name) return;
  
  // Format name for ui-avatars: handles spaces cleanly
  const formattedName = name.trim().replace(/\s+/g, "+");
  avatarImg.src = `https://ui-avatars.com/api/?name=${formattedName}&background=146b3a&color=fff&size=150&rounded=true&font-size=0.4&bold=true`;
}

function updateAuthUserWithProfile(updatedUserData) {
  const rawUser = localStorage.getItem("smartcampus_auth_user");
  if (!rawUser) return;

  try {
    const currentUser = JSON.parse(rawUser);
    const updatedUser = {
      ...currentUser,
      ...updatedUserData
    };
    localStorage.setItem("smartcampus_auth_user", JSON.stringify(updatedUser));
  } catch (error) {
    console.error("Error updating local auth user:", error);
  }
}

/* ================= DOM Helpers ================= */

function getElementByPossibleIds(ids) {
  for (const id of ids) {
    const element = document.getElementById(id);
    if (element) return element;
  }
  return null;
}

function getInputValue(ids) {
  const element = getElementByPossibleIds(ids);
  if (!element) return "";
  return cleanValue(element.value);
}

function setInputValue(ids, value) {
  const element = getElementByPossibleIds(ids);
  if (!element) return;
  element.value = cleanValue(value);
}

function cleanValue(value) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const cleaned = String(value).trim();
  if (
    !cleaned ||
    cleaned === "undefined" ||
    cleaned === "null" ||
    cleaned === "[object Object]"
  ) {
    return "";
  }
  return cleaned;
}

/* ================= Message ================= */

function showStudentProfileMessage(title, message) {
  if (typeof openModal === "function") {
    openModal(`
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(message)}</p>
    `);
    return;
  }
  alert(`${title}\n${message}`);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}