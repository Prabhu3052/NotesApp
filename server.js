const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

const app = express();

// ✅ CORS Configuration
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));

app.use(bodyParser.json());

const DATA_FILE = path.join(__dirname, "notes-data.json");

// Load notes from file (Async)
async function loadNotes() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("⚠️ Error reading notes file:", err.message);
    return []; // Return empty array if file doesn't exist or can't be read
  }
}

// Save notes to file (Async)
async function saveNotes(notes) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(notes, null, 2), "utf8");
  } catch (err) {
    console.error("❌ Error saving notes:", err.message);
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

// ✅ Default route to check server status
app.get("/", (req, res) => {
  res.status(200).send("✅ Notes API is running...");
});

// ✅ Get all notes
app.get("/notes", async (req, res) => {
  try {
    res.json(notes);
  } catch (err) {
    console.error("❌ Error fetching notes:", err.message);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// ✅ Add new note
app.post("/notes", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const newNote = { id: idCounter++, title, content };
    notes.push(newNote);
    await saveNotes(notes);

    res.status(201).json(newNote);
  } catch (err) {
    console.error("❌ Error adding note:", err.message);
    res.status(500).json({ error: "Failed to add note" });
  }
});

// ✅ Delete note
app.delete("/notes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    notes = notes.filter((note) => note.id !== id);
    await saveNotes(notes);

    res.status(204).send();
  } catch (err) {
    console.error("❌ Error deleting note:", err.message);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// ✅ Update note
app.put("/notes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content } = req.body;

    const noteIndex = notes.findIndex((n) => n.id === id);
    if (noteIndex === -1) {
      return res.status(404).json({ error: "Note not found" });
    }

    notes[noteIndex] = { ...notes[noteIndex], title, content };
    await saveNotes(notes);

    res.json(notes[noteIndex]);
  } catch (err) {
    console.error("❌ Error updating note:", err.message);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
