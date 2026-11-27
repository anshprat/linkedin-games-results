// Content script to extract game participation data from LinkedIn game results pages

console.log('LinkedIn Games Stats Tracker content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    console.log('Extract action received, attempting to extract game data...');
    const result = extractGameData();
    console.log('Extraction result:', result);
    sendResponse(result);
  }
  return true;
});

// Function to extract the number of connections who played
function extractGameData() {
  try {
    console.log('Current URL:', window.location.href);
    console.log('Page title:', document.title);

    // Get all text content
    const bodyText = document.body.innerText;
    console.log('Body text sample:', bodyText.substring(0, 500));

    // Look for pattern like "59 connections played today"
    // Matches variations: "X connections played today", "X connection played today"
    const patterns = [
      /(\d+)\s+connections?\s+played\s+today/i,
      /(\d+)\s+connections?\s+played/i,
      /(\d+)\s+people\s+played\s+today/i,
      /(\d+)\s+players?\s+today/i,
      /(\d+)\s+of\s+your\s+connections?\s+played/i,
      /played.*?(\d+)\s+connections?/i
    ];

    // First, try matching in the full body text
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match && match[1]) {
        const count = parseInt(match[1], 10);
        console.log(`✓ Found game data using pattern ${pattern}: ${count} connections played`);
        return { count, success: true, method: 'body text', pattern: pattern.toString() };
      }
    }

    console.log('No match in body text, trying specific selectors...');

    // Try to find the data in specific elements (fallback)
    const selectors = [
      '[class*="stats"]',
      '[class*="result"]',
      '[class*="player"]',
      '[class*="connection"]',
      '[data-test-id*="stat"]',
      '[data-test-id*="player"]',
      'main', 'article', 'section',
      'h1', 'h2', 'h3', 'h4', 'p', 'span', 'div'
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.trim();
        if (!text || text.length > 200) continue; // Skip empty or very long text

        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            const count = parseInt(match[1], 10);
            console.log(`✓ Found game data in ${selector}: ${count} connections played`);
            console.log(`Element text: "${text}"`);
            return { count, success: true, method: selector, text: text };
          }
        }
      }
    }

    // Debug: Log some page structure
    console.log('Page structure debug:');
    console.log('- Main elements:', document.querySelectorAll('main').length);
    console.log('- Sections:', document.querySelectorAll('section').length);
    console.log('- First h1:', document.querySelector('h1')?.textContent);
    console.log('- First h2:', document.querySelector('h2')?.textContent);

    console.warn('✗ No game data found on page');
    return {
      count: null,
      success: false,
      error: 'Pattern not found',
      debug: {
        url: window.location.href,
        title: document.title,
        bodyTextLength: bodyText.length
      }
    };

  } catch (error) {
    console.error('Error extracting game data:', error);
    return { count: null, success: false, error: error.message };
  }
}

// Auto-extract on page load (in case the script runs after page is ready)
window.addEventListener('load', () => {
  console.log('LinkedIn Games Stats Tracker: Page loaded');
});
