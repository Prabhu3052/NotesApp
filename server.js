const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DATA_FILE = path.join(__dirname, 'notes-data.json');

// Load notes from file
function loadNotes() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Save notes to file
function saveNotes(notes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2), 'utf8');
}

// Initialize with existing notes
let notes = loadNotes();
let idCounter = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;

// Get all notes
app.get('/notes', (req, res) => {
  res.json(notes);
});

// Add new note
app.post('/notes', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  const newNote = { id: idCounter++, title, content };
  notes.push(newNote);
  saveNotes(notes); // Save to file
  
  res.status(201).json(newNote);
});

// Delete note
app.delete('/notes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  notes = notes.filter(note => note.id !== id);
  saveNotes(notes); // Save to file
  
  res.status(204).send();
});

// Update note
app.put('/notes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, content } = req.body;
  
  const noteIndex = notes.findIndex(n => n.id === id);
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  notes[noteIndex] = { ...notes[noteIndex], title, content };
  saveNotes(notes); // Save to file
  
  res.json(notes[noteIndex]);
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Notes will be saved to ${DATA_FILE}`);
});