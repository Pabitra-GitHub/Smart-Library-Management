/**
 * AI Smart Book Search View
 * Implements PRD Section 6.9 & Section 10 (AI Feature Scope)
 */

const SmartSearchView = {
  currentQuery: '',

  async render(container) {
    container.innerHTML = `
      <div class="ai-search-hero">
        <div class="ai-header-badge">
          <span>✨</span> Intelligent Natural Language Search
        </div>
        <h1 style="font-size: 1.85rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.5rem;">
          Ask the AI Smart Library
        </h1>
        <p style="color: var(--text-secondary); font-size: 0.95rem; max-width: 780px;">
          Describe what you want to learn in plain English (e.g., <em>"I want a beginner book for learning Python"</em> or <em>"I need an easy book to learn Java"</em>). The AI will identify your learning level, extract key topics, and rank matching books in the library.
        </p>

        <div class="ai-query-box">
          <input type="text" id="ai-query-input" class="ai-input" placeholder="Type your natural language request here... (Press Enter or click Smart Search)" value="${this.currentQuery}" autofocus />
          <button id="btn-run-ai-search" class="btn btn-primary" style="padding: 0 1.75rem; font-size: 1rem;">
            <span>⚡</span> Smart Search
          </button>
        </div>

        <!-- Sample Query Chips -->
        <div style="margin-top: 1.25rem;">
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.6rem;">
            💡 Try One of These Sample Queries:
          </span>
          <div class="chips-container" id="ai-suggestion-chips" style="margin-bottom: 0;">
            <span class="chip ai-sample-chip" data-query="I want a beginner book for learning Python">"I want a beginner book for learning Python"</span>
            <span class="chip ai-sample-chip" data-query="I need an easy book to learn Java and OOP">"I need an easy book to learn Java"</span>
            <span class="chip ai-sample-chip" data-query="Advanced algorithms and data structures for semester exams">"Advanced algorithms & data structures"</span>
            <span class="chip ai-sample-chip" data-query="Database management systems and SQL queries">"DBMS and SQL queries"</span>
            <span class="chip ai-sample-chip" data-query="Machine learning and neural networks with Python">"Machine learning & neural networks"</span>
          </div>
        </div>
      </div>

      <!-- Live AI Pipeline Analysis Banner -->
      <div id="ai-analysis-output" style="display: none; margin-bottom: 2rem;"></div>

      <!-- AI Ranked Results -->
      <div id="ai-results-container">
        <div class="card" style="text-align: center; padding: 3rem 1.5rem;">
          <div style="font-size: 2.25rem; margin-bottom: 0.75rem;">🤖</div>
          <h3 style="font-size: 1.15rem; font-weight: 700;">AI Engine Ready</h3>
          <p style="color: var(--text-muted); margin-top: 0.35rem; max-width: 460px; margin-left: auto; margin-right: auto;">
            Enter a prompt above or click one of the sample queries to see real-time keyword extraction and intent-based matching in action.
          </p>
        </div>
      </div>
    `;

    // Event bindings
    const input = document.getElementById('ai-query-input');
    const searchBtn = document.getElementById('btn-run-ai-search');

    const triggerSearch = () => {
      const q = input.value.trim();
      if (q) {
        this.currentQuery = q;
        this.executeSmartSearch(q);
      } else {
        Toast.warning('Please enter a query or select a suggestion');
      }
    };

    searchBtn.addEventListener('click', triggerSearch);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') triggerSearch();
    });

    container.querySelectorAll('.ai-sample-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.dataset.query;
        input.value = q;
        this.currentQuery = q;
        this.executeSmartSearch(q);
      });
    });
  },

  async executeSmartSearch(query) {
    const analysisBox = document.getElementById('ai-analysis-output');
    const resultsContainer = document.getElementById('ai-results-container');
    const isLibrarian = state.currentUser && state.currentUser.role === 'librarian';

    resultsContainer.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem;">
        <div class="skeleton" style="height: 140px; margin-bottom: 1rem;"></div>
        <p style="color: var(--text-secondary);">Analyzing intent and scanning library catalog...</p>
      </div>
    `;

    try {
      const res = await API.smartSearch(query);

      // 1. Render AI Pipeline Explanation Banner
      analysisBox.style.display = 'block';
      analysisBox.innerHTML = `
        <div class="ai-analysis-banner">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.25rem;">🧠</span>
              <strong style="font-size: 0.95rem;">AI Intent & Keyword Analysis:</strong>
            </div>
            <span class="badge badge-category">${res.totalMatches} Matching Resource${res.totalMatches !== 1 ? 's' : ''} Found</span>
          </div>

          <div style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 0.25rem;">
            <strong>Detected Goal:</strong> ${res.intentSummary}
            ${res.detectedLevel ? ` • <strong>Target Difficulty:</strong> <span class="badge badge-info">${res.detectedLevel}</span>` : ''}
          </div>

          <div style="margin-top: 0.5rem;">
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 0.35rem;">
              Extracted Keywords:
            </span>
            <div class="keyword-chips-row">
              ${(res.extractedKeywords || []).map(k => `
                <span class="keyword-tag">🏷️ ${k}</span>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      // 2. Render Ranked Book Matches
      const books = res.results || [];
      if (books.length === 0) {
        resultsContainer.innerHTML = `
          <div class="card" style="text-align: center; padding: 3.5rem;">
            <div style="font-size: 2.25rem; margin-bottom: 0.75rem;">📚</div>
            <h3 style="font-size: 1.15rem; font-weight: 700;">No direct book matches found</h3>
            <p style="color: var(--text-muted); margin-top: 0.35rem;">
              No books matched the extracted keywords <strong>${res.extractedKeywords.join(', ')}</strong>. Try broadening your query.
            </p>
          </div>
        `;
        return;
      }

      resultsContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          ${books.map((b, idx) => {
            const isAvailable = b.availableCopies > 0;
            const rankLabel = idx === 0 ? '🏆 Best Match' : `#${idx + 1} Match`;

            return `
              <div class="card" style="border-left: 4px solid var(--primary); transition: transform 0.2s ease;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem;">
                      <span class="badge badge-primary" style="background: var(--primary); color: #fff; font-size: 0.7rem;">${rankLabel}</span>
                      <span class="relevance-score-badge">⚡ ${b.matchPercentage}% Relevance</span>
                      <span class="badge badge-category">${b.category}</span>
                      <span class="book-id-badge">${b.id}</span>
                    </div>

                    <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.25rem;">
                      ${b.title}
                    </h2>
                    <p style="font-size: 0.88rem; color: var(--text-secondary);">
                      By <strong>${b.author}</strong> • ${b.publisher} (${b.publicationYear})
                    </p>
                  </div>

                  <div style="text-align: right;">
                    ${isAvailable
                      ? `<span class="badge badge-success">${b.availableCopies} of ${b.totalCopies} Available</span>`
                      : `<span class="badge badge-danger">Currently Borrowed</span>`}
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem;">
                      Shelf: <strong>📍 ${b.shelfNumber}</strong>
                    </div>
                  </div>
                </div>

                <p style="font-size: 0.88rem; line-height: 1.5; color: var(--text-secondary); margin: 0.85rem 0;">
                  ${b.description || 'Core reference textbook.'}
                </p>

                <!-- AI Match Reasons -->
                <div style="background: var(--bg-surface); padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Why it matched:</span>
                    ${(b.matchReasons || []).map(r => `
                      <span style="font-size: 0.78rem; background: var(--bg-card); padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); color: var(--text-primary);">
                        ✓ ${r}
                      </span>
                    `).join('')}
                  </div>

                  <div style="display: flex; gap: 0.4rem;">
                    ${isLibrarian && isAvailable ? `
                      <button class="btn btn-primary btn-sm" onclick="IssuesView.openIssueModal('${b.id}')">
                        Issue Book
                      </button>
                    ` : `
                      <button class="btn btn-secondary btn-sm" onclick="BooksView.viewBookDetail('${b.id}')">
                        View Details
                      </button>
                    `}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (err) {
      resultsContainer.innerHTML = `<p style="color: var(--danger); padding: 1.5rem;">AI Search Error: ${err.message}</p>`;
    }
  }
};
