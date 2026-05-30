/* =========================================================
   SmartCampus Election - Results JS
   Handles:
   - Fetching real results from backend API
   - Show/hide published/unpublished states
   - Rendering turnout stats, winner cards, and vote bars
   - Auto-refreshing results every 10 seconds
========================================================= */

let refreshInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  setupResultsPage();
});

function setupResultsPage() {
  fetchAndRenderResults();
  
  // Auto-refresh every 10 seconds
  refreshInterval = setInterval(fetchAndRenderResults, 10000);
}

async function fetchAndRenderResults() {
  try {
    const result = await apiRequest('/public/results');

    if (!result.success) {
      console.error("Failed to fetch results:", result.message);
      return;
    }

    if (result.data && result.data.resultsPublished) {
      updateResultsState(true);
      renderTurnoutStats(result.data);
      renderWinnerCards(result.data.positions);
      renderResultsCharts(result.data.positions);
    } else {
      updateResultsState(false);
    }
  } catch (error) {
    console.error("Error fetching results:", error);
  }
}

function updateResultsState(isPublished) {
  const unpublishedBlock = document.getElementById("resultsUnpublished");
  const publishedBlock = document.getElementById("resultsPublished");

  if (isPublished) {
    unpublishedBlock.classList.add("results-hidden");
    publishedBlock.classList.remove("results-hidden");
  } else {
    unpublishedBlock.classList.remove("results-hidden");
    publishedBlock.classList.add("results-hidden");
  }
}

function renderTurnoutStats(data) {
  const eligibleVotersEl = document.getElementById("eligibleVoters");
  const votesCastEl = document.getElementById("votesCast");
  const turnoutRateEl = document.getElementById("turnoutRate");

  if (!eligibleVotersEl || !votesCastEl || !turnoutRateEl) return;

  eligibleVotersEl.textContent = (data.totalEligibleVoters || 0).toLocaleString();
  votesCastEl.textContent = (data.totalVotesCast || 0).toLocaleString();
  turnoutRateEl.textContent = `${data.turnoutRate || 0}%`;
}

function renderWinnerCards(positions) {
  const winnerCards = document.getElementById("winnerCards");
  if (!winnerCards) return;

  if (!positions || positions.length === 0) {
    winnerCards.innerHTML = "<p>No positions found.</p>";
    return;
  }

  const winnerHTML = positions.map(pos => {
    // A position might have multiple winners if there's a tie
    const winners = pos.candidates.filter(c => c.isWinner);
    
    if (winners.length === 0) {
      return `
        <article class="card winner-card">
          <h3>${pos.title}</h3>
          <p class="muted">No votes yet</p>
        </article>
      `;
    }

    return winners.map(winner => `
      <article class="card winner-card">
        <span class="badge badge-gold">Winner</span>
        <h3>${pos.title}</h3>
        <p class="winner-highlight">${winner.name}</p>
        <p><strong>Department:</strong> ${winner.department || 'N/A'}</p>
        <p><strong>Votes:</strong> ${winner.votes}</p>
      </article>
    `).join("");
  }).join("");

  winnerCards.innerHTML = winnerHTML;
}

function renderResultsCharts(positions) {
  const resultsCharts = document.getElementById("resultsCharts");
  if (!resultsCharts) return;

  if (!positions || positions.length === 0) {
    resultsCharts.innerHTML = "<p>No candidates available.</p>";
    return;
  }

  resultsCharts.innerHTML = positions.map(pos => {
    let maxVotes = 0;
    if (pos.candidates && pos.candidates.length > 0) {
      maxVotes = pos.candidates[0].votes;
    }

    let candidatesHTML = "";
    if (pos.candidates.length === 0) {
      candidatesHTML = "<p class='muted' style='padding:1rem 0;'>No candidates for this position.</p>";
    } else {
      candidatesHTML = pos.candidates.map((candidate, index) => {
        const percent = maxVotes > 0 ? ((candidate.votes / maxVotes) * 100).toFixed(1) : 0;
        const leadingText = candidate.isWinner ? " (Leading/Winner)" : "";

        return `
          <div class="result-candidate-row">
            <div class="result-label-row">
              <span>${candidate.name}${leadingText}</span>
              <span>${candidate.votes} votes</span>
            </div>
            <div class="result-bar-track">
              <div class="result-bar-fill" style="width: ${percent}%;"></div>
            </div>
          </div>
        `;
      }).join("");
    }

    return `
      <article class="result-position-card">
        <h3>${pos.title}</h3>
        ${candidatesHTML}
      </article>
    `;
  }).join("");
}