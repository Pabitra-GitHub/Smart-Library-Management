const db = require('../data/db');

/**
 * Books Management Controller
 * Implements PRD Section 6.2 (Book Management) & Section 6.8 (Normal Book Search)
 */
class BooksController {
  getAllBooks(req, res) {
    try {
      const { search, category, availableOnly } = req.query;
      let books = db.get('books');

      // Category filter
      if (category && category !== 'All') {
        books = books.filter(b => b.category && b.category.toLowerCase() === category.toLowerCase());
      }

      // Availability filter
      if (availableOnly === 'true') {
        books = books.filter(b => b.availableCopies > 0);
      }

      // Standard multi-field search (Title, Author, ISBN, Shelf, Category)
      if (search && search.trim() !== '') {
        const query = search.toLowerCase().trim();
        books = books.filter(b =>
          (b.title && b.title.toLowerCase().includes(query)) ||
          (b.author && b.author.toLowerCase().includes(query)) ||
          (b.isbn && b.isbn.toLowerCase().includes(query)) ||
          (b.category && b.category.toLowerCase().includes(query)) ||
          (b.shelfNumber && b.shelfNumber.toLowerCase().includes(query))
        );
      }

      return res.json({
        success: true,
        count: books.length,
        books
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  getBookById(req, res) {
    try {
      const { id } = req.params;
      const book = db.getById('books', id);

      if (!book) {
        return res.status(404).json({ success: false, message: 'Book not found' });
      }

      // Fetch borrowing history for this book
      const allIssues = db.get('issues');
      const bookIssues = allIssues.filter(i => i.bookId === id);

      return res.json({
        success: true,
        book,
        history: bookIssues
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  createBook(req, res) {
    try {
      const {
        title,
        author,
        isbn,
        category,
        publisher,
        publicationYear,
        totalCopies,
        shelfNumber,
        description,
        tags,
        level
      } = req.body;

      if (!title || !author || !category || !totalCopies || !shelfNumber) {
        return res.status(400).json({
          success: false,
          message: 'Title, author, category, total copies, and shelf number are required'
        });
      }

      const copiesNum = parseInt(totalCopies, 10);
      if (isNaN(copiesNum) || copiesNum <= 0) {
        return res.status(400).json({ success: false, message: 'Total copies must be a positive number' });
      }

      let publicationYearValue = new Date().getFullYear();
      if (publicationYear) {
        publicationYearValue = parseInt(publicationYear, 10);
        if (Number.isNaN(publicationYearValue) || publicationYearValue < 1000 || publicationYearValue > 9999) {
          return res.status(400).json({ success: false, message: 'Publication year must be a valid 4-digit year' });
        }
      }

      const existingBooks = db.get('books');
      if (isbn && existingBooks.some(b => b.isbn && b.isbn.trim() === isbn.trim())) {
        return res.status(400).json({ success: false, message: 'A book with this ISBN already exists' });
      }

      // Generate next sequential Book ID
      const bookNum = existingBooks
        .filter(b => typeof b.id === 'string' && /^BK-\d+$/.test(b.id))
        .map(b => parseInt(b.id.replace('BK-', ''), 10))
        .filter(Number.isFinite)
        .reduce((max, num) => Math.max(max, num), 100) + 1;
      const newBook = {
        id: `BK-${bookNum}`,
        title: title.trim(),
        author: author.trim(),
        isbn: isbn ? isbn.trim() : `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        category: category.trim(),
        publisher: publisher ? publisher.trim() : 'College Press',
        publicationYear: publicationYearValue,
        totalCopies: copiesNum,
        availableCopies: copiesNum,
        shelfNumber: shelfNumber.trim(),
        description: description ? description.trim() : '',
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim().toLowerCase()) : []),
        level: level || 'Intermediate',
        createdAt: new Date().toISOString()
      };

      db.insert('books', newBook);
      db.logAudit('ADD_BOOK', `Added new book "${newBook.title}" (ID: ${newBook.id})`, req.body.performedBy || 'Librarian');

      return res.status(201).json({
        success: true,
        message: `Book "${newBook.title}" added successfully!`,
        book: newBook
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  updateBook(req, res) {
    try {
      const { id } = req.params;
      const book = db.getById('books', id);

      if (!book) {
        return res.status(404).json({ success: false, message: 'Book not found' });
      }

      const {
        title,
        author,
        isbn,
        category,
        publisher,
        publicationYear,
        totalCopies,
        shelfNumber,
        description,
        tags,
        level
      } = req.body;

      const updates = {};
      if (title) updates.title = title.trim();
      if (author) updates.author = author.trim();
      if (isbn) {
        const cleanIsbn = isbn.trim();
        const duplicateIsbn = db.get('books').some(b => b.id !== id && b.isbn && b.isbn.trim() === cleanIsbn);
        if (duplicateIsbn) {
          return res.status(400).json({ success: false, message: 'A different book already uses this ISBN' });
        }
        updates.isbn = cleanIsbn;
      }
      if (category) updates.category = category.trim();
      if (publisher) updates.publisher = publisher.trim();
      if (publicationYear) {
        const year = parseInt(publicationYear, 10);
        if (Number.isNaN(year) || year < 1000 || year > 9999) {
          return res.status(400).json({ success: false, message: 'Publication year must be a valid 4-digit year' });
        }
        updates.publicationYear = year;
      }
      if (shelfNumber) updates.shelfNumber = shelfNumber.trim();
      if (description !== undefined) updates.description = String(description).trim();
      if (level) updates.level = level;
      if (tags) {
        updates.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim().toLowerCase());
      }

      // Handle total copies adjustment safely
      if (totalCopies !== undefined) {
        const newTotal = parseInt(totalCopies, 10);
        if (isNaN(newTotal) || newTotal < 0) {
          return res.status(400).json({ success: false, message: 'Total copies must be 0 or greater' });
        }
        const diff = newTotal - book.totalCopies;
        const newAvailable = book.availableCopies + diff;
        if (newAvailable < 0) {
          return res.status(400).json({
            success: false,
            message: `Cannot reduce total copies below currently issued count (${book.totalCopies - book.availableCopies} currently issued)`
          });
        }
        updates.totalCopies = newTotal;
        updates.availableCopies = newAvailable;
      }

      const updated = db.update('books', id, updates);
      db.logAudit('UPDATE_BOOK', `Updated book "${updated.title}" (ID: ${id})`, req.body.performedBy || 'Librarian');

      return res.json({
        success: true,
        message: 'Book updated successfully',
        book: updated
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  deleteBook(req, res) {
    try {
      const { id } = req.params;
      const book = db.getById('books', id);

      if (!book) {
        return res.status(404).json({ success: false, message: 'Book not found' });
      }

      // Guard: Ensure book has no active loans
      const activeIssues = db.find('issues', i => i.bookId === id && !i.returnDate);
      if (activeIssues.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete book. There are currently ${activeIssues.length} active copy/copies issued to students.`
        });
      }

      db.delete('books', id);
      db.logAudit('DELETE_BOOK', `Deleted book "${book.title}" (ID: ${id})`, req.query.performedBy || 'Librarian');

      return res.json({
        success: true,
        message: `Book "${book.title}" was deleted from the catalog`
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  getCategories(req, res) {
    try {
      const books = db.get('books');
      const categories = Array.from(new Set(books.map(b => b.category).filter(Boolean))).sort();
      return res.json({ success: true, categories });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new BooksController();
