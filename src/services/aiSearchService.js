const db = require('../data/db');

/**
 * AI Smart Book Search Service
 * Implements PRD Section 6.9 & Section 10.
 * Performs NLP-based intent parsing, entity/keyword extraction, and weighted relevance ranking.
 */
class AISearchService {
  constructor() {
    // Common English stopwords to filter out
    this.stopwords = new Set([
      'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
      'any', 'are', 'aren', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
      'below', 'between', 'both', 'but', 'by', 'can', 'could', 'did', 'do', 'does',
      'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
      'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
      'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
      'just', 'me', 'more', 'most', 'my', 'myself', 'need', 'no', 'nor', 'not', 'now',
      'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves',
      'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
      'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
      'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
      'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
      'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
      'want', 'look', 'looking', 'find', 'give', 'show', 'please', 'tell', 'read',
      'book', 'books', 'textbook', 'textbooks', 'guide', 'learn', 'learning', 'study'
    ]);

    // Synonym and intent dictionary
    this.intentKeywords = {
      beginner: ['beginner', 'easy', 'start', 'starter', 'novice', 'simple', 'basics', 'introduction', 'introductory', 'scratch', 'fundamental', 'fundamentals'],
      advanced: ['advanced', 'deep', 'mastery', 'expert', 'complex', 'internals', 'in-depth', 'professional', 'optimization'],
      intermediate: ['intermediate', 'practical', 'hands-on', 'real-world', 'projects', 'applied'],
      python: ['python', 'py', 'django', 'flask'],
      java: ['java', 'spring', 'jvm'],
      programming: ['code', 'coding', 'programming', 'software', 'developer', 'development'],
      algorithms: ['algorithm', 'algorithms', 'dsa', 'data structures', 'sorting', 'graphs', 'trees', 'recursion', 'dynamic programming'],
      ai: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'neural networks', 'neural', 'nlp', 'data science'],
      database: ['database', 'databases', 'dbms', 'sql', 'mysql', 'relational', 'queries', 'query', 'normalization'],
      os: ['os', 'operating', 'operating systems', 'operating system', 'linux', 'unix', 'processes', 'threads', 'deadlocks', 'memory'],
      network: ['network', 'networks', 'networking', 'tcp', 'ip', 'protocols', 'internet', 'routing'],
      web: ['web', 'frontend', 'backend', 'fullstack', 'full-stack', 'html', 'css', 'react', 'node', 'javascript']
    };
  }

  /**
   * Tokenizes and normalizes the input query.
   * @param {string} query
   * @returns {string[]}
   */
  tokenize(query) {
    if (!query) return [];
    return query
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  /**
   * Extracts meaningful keywords and detected intent from natural language query.
   * @param {string} rawQuery
   * @returns {{ keywords: string[], intentSummary: string, targetLevel: string|null, detectedDomains: string[] }}
   */
  extractIntentAndKeywords(rawQuery) {
    const tokens = this.tokenize(rawQuery);
    const meaningfulTokens = tokens.filter(t => !this.stopwords.has(t));
    const lowerQuery = (rawQuery || '').toLowerCase();

    const extractedSet = new Set();
    let detectedLevel = null;
    const detectedDomains = [];

    // Analyze tokens and multi-word phrases against intent clusters
    for (const token of tokens) {
      // Check level
      if (this.intentKeywords.beginner.includes(token)) {
        detectedLevel = 'Beginner';
        extractedSet.add('Beginner');
      } else if (this.intentKeywords.advanced.includes(token)) {
        detectedLevel = 'Advanced';
        extractedSet.add('Advanced');
      } else if (this.intentKeywords.intermediate.includes(token)) {
        detectedLevel = 'Intermediate';
        extractedSet.add('Intermediate');
      }
    }

    // Check technology / subject domains (token & multi-word match)
    for (const [domain, keywords] of Object.entries(this.intentKeywords)) {
      if (['beginner', 'advanced', 'intermediate'].includes(domain)) continue;

      const hasMatch = keywords.some(k => {
        if (k.includes(' ')) {
          return lowerQuery.includes(k);
        }
        return tokens.includes(k);
      });

      if (hasMatch) {
        const capitalized = domain === 'os' ? 'Operating Systems' : (domain === 'ai' ? 'AI / ML' : (domain.charAt(0).toUpperCase() + domain.slice(1)));
        extractedSet.add(capitalized);
        if (!detectedDomains.includes(capitalized)) {
          detectedDomains.push(capitalized);
        }
      }
    }

    // Add remaining meaningful tokens as keywords
    for (const t of meaningfulTokens) {
      const clean = t.charAt(0).toUpperCase() + t.slice(1);
      extractedSet.add(clean);
    }

    const keywords = Array.from(extractedSet);

    // Formulate a natural language summary of detected intent
    let intentSummary = 'General Book Search';
    if (detectedDomains.length > 0 && detectedLevel) {
      intentSummary = `Looking for ${detectedLevel}-level resources in ${detectedDomains.join(' & ')}`;
    } else if (detectedDomains.length > 0) {
      intentSummary = `Looking for technical material on ${detectedDomains.join(', ')}`;
    } else if (detectedLevel) {
      intentSummary = `Looking for ${detectedLevel}-level educational materials`;
    } else if (keywords.length > 0) {
      intentSummary = `Matching library resources for: ${keywords.slice(0, 4).join(', ')}`;
    }

    return {
      keywords,
      intentSummary,
      targetLevel: detectedLevel,
      detectedDomains
    };
  }

  /**
   * Search books using NLP extraction and calculate weighted relevance scores.
   * @param {string} userQuery
   * @returns {{ query: string, extractedKeywords: string[], intentSummary: string, results: object[] }}
   */
  smartSearch(userQuery) {
    if (!userQuery || userQuery.trim() === '') {
      return {
        query: '',
        extractedKeywords: [],
        intentSummary: 'Empty query provided',
        results: []
      };
    }

    const { keywords, intentSummary, targetLevel, detectedDomains } = this.extractIntentAndKeywords(userQuery);
    const searchTerms = keywords.map(k => k.toLowerCase());
    const rawTokens = this.tokenize(userQuery);

    const allBooks = db.get('books');
    const scoredBooks = [];

    for (const book of allBooks) {
      let score = 0;
      const matchedAspects = [];

      const titleLower = (book.title || '').toLowerCase();
      const authorLower = (book.author || '').toLowerCase();
      const categoryLower = (book.category || '').toLowerCase();
      const descLower = (book.description || '').toLowerCase();
      const tagsLower = (book.tags || []).map(t => t.toLowerCase());
      const level = (book.level || '').toLowerCase();

      // 1. Exact match in title (Highest Weight: 4.0)
      for (const term of searchTerms) {
        if (titleLower.includes(term)) {
          score += 4.0;
          matchedAspects.push(`Title contains "${term}"`);
        }
      }

      // 2. Category match (Weight: 3.0)
      for (const term of searchTerms) {
        if (categoryLower.includes(term)) {
          score += 3.0;
          matchedAspects.push(`Category "${book.category}" matches`);
        }
      }

      // 3. Level match (Weight: 2.5)
      if (targetLevel && level === targetLevel.toLowerCase()) {
        score += 2.5;
        matchedAspects.push(`${targetLevel} difficulty match`);
      }

      // 4. Tags match (Weight: 2.0)
      for (const tag of tagsLower) {
        for (const term of searchTerms) {
          if (tag.includes(term) || term.includes(tag)) {
            score += 2.0;
            if (!matchedAspects.some(a => a.includes(`Tag "${tag}"`))) {
              matchedAspects.push(`Tag "${tag}"`);
            }
          }
        }
      }

      // 5. Description occurrence (Weight: 1.2)
      for (const term of searchTerms) {
        if (descLower.includes(term)) {
          score += 1.2;
          if (!matchedAspects.some(a => a.includes('Description match'))) {
            matchedAspects.push(`Description matches "${term}"`);
          }
        }
      }

      // 6. Author match (Weight: 1.5)
      for (const term of searchTerms) {
        if (authorLower.includes(term)) {
          score += 1.5;
          matchedAspects.push(`Author "${book.author}" matches`);
        }
      }

      // 7. Direct raw query phrase match bonus
      if (titleLower.includes(userQuery.toLowerCase())) {
        score += 5.0;
        matchedAspects.push('Full title phrase match');
      }

      if (score > 0) {
        // Calculate a normalized match percentage (capped at 99%)
        const confidencePercentage = Math.min(99, Math.round(score * 12));

        scoredBooks.push({
          ...book,
          relevanceScore: Number(score.toFixed(1)),
          matchPercentage: confidencePercentage,
          matchReasons: Array.from(new Set(matchedAspects)).slice(0, 4)
        });
      }
    }

    // Sort by relevance score descending
    scoredBooks.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      query: userQuery,
      extractedKeywords: keywords,
      intentSummary,
      detectedLevel: targetLevel,
      detectedDomains,
      totalMatches: scoredBooks.length,
      results: scoredBooks
    };
  }
}

module.exports = new AISearchService();
