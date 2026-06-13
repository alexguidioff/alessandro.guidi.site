// Fetch the most recently updated public repos from the GitHub API and render
// them as cards. Runs client-side on every visit, so it stays up to date
// without rebuilding the site. Unauthenticated API: 60 requests/hour per IP.
(function () {
  var el = document.getElementById('github-repos');
  if (!el) {
    return;
  }

  var user = el.getAttribute('data-user');
  var count = parseInt(el.getAttribute('data-count'), 10) || 6;
  if (!user) {
    return;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function formatDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short' });
  }

  function showError() {
    el.innerHTML =
      '<p class="github-error">Couldn’t reach GitHub right now. ' +
      '<a href="https://github.com/' +
      encodeURIComponent(user) +
      '" target="_blank" rel="noreferrer">View my profile →</a></p>';
  }

  var endpoint =
    'https://api.github.com/users/' +
    encodeURIComponent(user) +
    '/repos?sort=updated&per_page=100';

  fetch(endpoint)
    .then(function (response) {
      if (!response.ok) {
        throw new Error('GitHub API responded ' + response.status);
      }
      return response.json();
    })
    .then(function (repos) {
      if (!Array.isArray(repos)) {
        throw new Error('Unexpected GitHub response');
      }

      var list = repos
        .filter(function (repo) {
          return !repo.fork && !repo.archived;
        })
        .slice(0, count);

      if (!list.length) {
        el.innerHTML =
          '<p class="github-error">No public repositories yet.</p>';
        return;
      }

      var grid = document.createElement('div');
      grid.className = 'github-grid';

      list.forEach(function (repo) {
        var card = document.createElement('a');
        card.className = 'repo-card';
        card.href = repo.html_url;
        card.target = '_blank';
        card.rel = 'noreferrer';

        var lang = repo.language
          ? '<span class="repo-lang">' + escapeHtml(repo.language) + '</span>'
          : '';
        var desc = repo.description
          ? escapeHtml(repo.description)
          : 'No description provided.';
        var updated = formatDate(repo.pushed_at);

        card.innerHTML =
          '<h3 class="repo-name">' +
          escapeHtml(repo.name) +
          '</h3>' +
          '<p class="repo-desc">' +
          desc +
          '</p>' +
          '<div class="repo-meta">' +
          lang +
          '<span class="repo-stat"><i class="fas fa-star"></i> ' +
          repo.stargazers_count +
          '</span>' +
          '<span class="repo-stat"><i class="fas fa-code-branch"></i> ' +
          repo.forks_count +
          '</span>' +
          (updated
            ? '<span class="repo-updated">Updated ' + updated + '</span>'
            : '') +
          '</div>';

        grid.appendChild(card);
      });

      el.innerHTML = '';
      el.appendChild(grid);
    })
    .catch(function () {
      showError();
    });
})();
