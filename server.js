const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs").promises; // Use async file handling
const path = require("path");
require("dotenv").config(); // Load environment variables

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "*" })); // Allow frontend access
app.use(bodyParser.json());

const DATA_FILE = path.join(__dirname, "notes-data.json");

// Load notes from file (Async)
async function loadNotes() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return []; // Return empty array if file doesn't exist
  }
}

// Save notes to file (Async)
async function saveNotes(notes) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(notes, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving notes:", err);
  }
}

// Initialize notes
let notes = [];
let idCounter = 1;

async function initializeNotes() {
  notes = await loadNotes();
  idCounter = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1;
}
initializeNotes(); // Load existing notes on startup

// Default route to check server status
app.get("/", (req, res) => {
  res.send("Notes API is running...");
});

// Get all notes
app.get("/notes", async (req, res) => {
  res.json(notes);
});

// Add new note
app.post("/notes", async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  const newNote = { id: idCounter++, title, content };
  notes.push(newNote);
  await saveNotes(notes); // Save to file

  res.status(201).json(newNote);
});

// Delete note
app.delete("/notes/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  notes = notes.filter((note) => note.id !== id);
  await saveNotes(notes); // Save to file

  res.status(204).send();
});

// Update note
app.put("/notes/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, content } = req.body;

  const noteIndex = notes.findIndex((n) => n.id === id);
  if (noteIndex === -1) {
    return res.status(404).json({ error: "Note not found" });
  }

  notes[noteIndex] = { ...notes[noteIndex], title, content };
  await saveNotes(notes); // Save to file

  res.json(notes[noteIndex]);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
