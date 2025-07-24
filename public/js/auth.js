// ✅ Generate CAPTCHA
function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const captchaText = document.getElementById("captchaText");
  const captchaInput = document.getElementById("captchaInput");
  const message = document.getElementById("message");

  if (signupForm) {
    let currentCaptcha = generateCaptcha();
    if (captchaText) captchaText.innerText = currentCaptcha;

    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const role = document.getElementById("role").value;

      if (!email || !password || !role) {
        message.innerText = "❌ All fields are required.";
        return;
      }

      if (captchaInput.value.trim() !== currentCaptcha) {
        message.innerText = "❌ CAPTCHA incorrect.";
        currentCaptcha = generateCaptcha();
        captchaText.innerText = currentCaptcha;
        captchaInput.value = '';
        return;
      }

      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role })
        });

        const data = await res.json();
        if (res.ok) {
          alert("✅ Registered successfully! Please log in.");
          window.location.href = "index.html";
        } else {
          message.innerText = "❌ " + (data.message || data.error);
        }
      } catch (err) {
        message.innerText = "❌ Server error. Try again.";
      }
    });
  }
});
