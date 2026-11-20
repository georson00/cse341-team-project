// Updated books controller with secure 500 error handling
// (Logs detailed error on the server, returns generic message to client)

const Book = require('../models/books');

// Get all books
const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find({});
    return res.status(200).json(books);
  } catch (err) {
    console.error('Internal server error (getAllBooks):', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get single book by ID
const getBookById = async (req, res) => {
  try {
    const bookId = req.params.id;
    const book = await Book.findById(bookId);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    return res.status(200).json(book);
  } catch (err) {
    console.error('Internal server error (getBookById):', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllBooks,
  getBookById
};
