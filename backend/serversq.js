const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database setup
const db = new sqlite3.Database('./notes.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create table if not exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Get all notes
app.get('/notes', (req, res) => {
  db.all('SELECT * FROM notes ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching notes:', err);
      return res.status(500).json({ error: 'Failed to fetch notes' });
    }
    res.json(rows);
  });
});

// Add new note
app.post('/notes', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  db.run(
    'INSERT INTO notes (title, content) VALUES (?, ?)',
    [title, content],
    function (err) {
      if (err) {
        console.error('Error adding note:', err);
        return res.status(500).json({ error: 'Failed to add note' });
      }
      res.status(201).json({
        id: this.lastID,
        title,
        content,
        created_at: new Date().toISOString()
      });
    }
  );
});

// Delete note
app.delete('/notes/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM notes WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error deleting note:', err);
      return res.status(500).json({ error: 'Failed to delete note' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(204).send();
  });
});

// Update note
app.put('/notes/:id', (req, res) => {
  const id = req.params.id;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  db.run(
    'UPDATE notes SET title = ?, content = ? WHERE id = ?',
    [title, content, id],
    function (err) {
      if (err) {
        console.error('Error updating note:', err);
        return res.status(500).json({ error: 'Failed to update note' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Note not found' });
      }
      db.get('SELECT * FROM notes WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error fetching updated note:', err);
          return res.status(500).json({ error: 'Failed to fetch updated note' });
        }
        res.json(row);
      });
    }
  );
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Close database connection when server stops
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});