document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML with remove buttons
        let participantsHtml = "";
        if (details.participants && details.participants.length > 0) {
          participantsHtml = `<ul class="participants-list">${details.participants
            .map((p) => `<li class="participant-item">${p}<button class="remove-participant" data-activity="${encodeURIComponent(
              name
            )}" data-email="${encodeURIComponent(p)}" aria-label="Remove ${p}">✖</button></li>`)
            .join("")}</ul>`;
        } else {
          participantsHtml = `<p class="no-participants">No participants yet</p>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p class="desc">${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants:</strong>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Attach event delegation for remove buttons
      activitiesList.addEventListener("click", async (ev) => {
        const btn = ev.target.closest && ev.target.closest(".remove-participant");
        if (!btn) return;
        const activityName = decodeURIComponent(btn.dataset.activity);
        const email = decodeURIComponent(btn.dataset.email);

        if (!confirm(`Remove ${email} from ${activityName}?`)) return;

        try {
          const res = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(
            email
          )}`, { method: "DELETE" });

          const result = await res.json();
          if (res.ok) {
            messageDiv.textContent = result.message;
            messageDiv.className = "message success";
            // Refresh activities
            fetchActivities();
          } else {
            messageDiv.textContent = result.detail || "Failed to remove participant";
            messageDiv.className = "message error";
          }
        } catch (error) {
          messageDiv.textContent = "Failed to remove participant";
          messageDiv.className = "message error";
          console.error(error);
        }
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 4000);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities to show new participant and updated availability
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
