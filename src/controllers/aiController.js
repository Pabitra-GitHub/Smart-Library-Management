const aiSearchService = require('../services/aiSearchService');

/**
 * AI Smart Search Controller
 * Implements PRD Section 6.9 & Section 10
 */
class AIController {
  search(req, res) {
    try {
      const { query } = req.body;

      if (!query || query.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'A search query is required (e.g. "I want a beginner book for learning Python")'
        });
      }

      const result = aiSearchService.smartSearch(query);

      return res.json({
        success: true,
        ...result
      });
    } catch (err) {
      console.error('AI Smart Search Error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  extractKeywords(req, res) {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ success: false, message: 'Query is required' });
      }

      const analysis = aiSearchService.extractIntentAndKeywords(query);
      return res.json({
        success: true,
        ...analysis
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  getSuggestedQueries(req, res) {
    const suggestions = [
      'I want a beginner book for learning Python',
      'I need an easy book to learn Java and OOP',
      'Advanced algorithms and data structures for 5th semester',
      'Practical machine learning and neural networks',
      'Fundamental operating system concepts and deadlocks',
      'Database management systems and SQL queries',
      'Modern full-stack web development with React and Node',
      'Computer networking and TCP/IP protocol stack'
    ];
    return res.json({ success: true, suggestions });
  }
}

module.exports = new AIController();
