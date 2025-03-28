import React, { useState, useEffect } from "react";
import axios from "axios";
import "./NotesApp.css";

const NotesApp = () => {
    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get("http://localhost:5000/notes");
            setNotes(response.data);
        } catch (error) {
            console.error("Error fetching notes:", error);
            setError("Failed to fetch notes. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            setError("Title and content are required!");
            return;
        }

        setError("");
        try {
            if (editing) {
                await updateNote();
            } else {
                await addNote();
            }
        } catch (error) {
            console.error("Error saving note:", error);
            setError("Failed to save note. Please try again.");
        }
    };

    const addNote = async () => {
        const response = await axios.post("http://localhost:5000/notes", { 
            title: title.trim(), 
            content: content.trim() 
        });
        setNotes([...notes, response.data]);
        resetForm();
    };

    const updateNote = async () => {
        const response = await axios.put(
            `http://localhost:5000/notes/${editing}`, 
            { 
                title: title.trim(), 
                content: content.trim() 
            }
        );
        setNotes(notes.map((note) => (note.id === editing ? response.data : note)));
        resetForm();
    };

    const deleteNote = async (id) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
        
        try {
            await axios.delete(`http://localhost:5000/notes/${id}`);
            setNotes(notes.filter((note) => note.id !== id));
        } catch (error) {
            console.error("Error deleting note:", error);
            setError("Failed to delete note. Please try again.");
        }
    };

    const handleEdit = (note) => {
        setEditing(note.id);
        setTitle(note.title);
        setContent(note.content);
    };

    const resetForm = () => {
        setEditing(null);
        setTitle("");
        setContent("");
    };

    const cancelEdit = () => {
        resetForm();
    };

    return (
        <div className="notes-container">
            <div className="notes-wrapper">
                <h1 className="notes-title">📝 Notes App</h1>

                {/* Error message display */}
                {error && <div className="notes-error">{error}</div>}

                {/* Form for adding/updating notes */}
                <form onSubmit={handleSubmit} className="notes-form">
                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="notes-input"
                    />
                    <textarea
                        placeholder="Content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="notes-textarea"
                        rows="5"
                    />
                    <div className="notes-button-group">
                        <button type="submit" className="notes-button">
                            {editing ? "Update Note" : "Add Note"}
                        </button>
                        {editing && (
                            <button 
                                type="button" 
                                onClick={cancelEdit}
                                className="notes-button cancel-button"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                {/* Loading state */}
                {loading && <div className="notes-loading">Loading...</div>}

                {/* Display notes */}
                {notes.length === 0 && !loading ? (
                    <div className="notes-empty">No notes yet. Add your first note!</div>
                ) : (
                    <ul className="notes-list">
                        {notes.map((note) => (
                            <li key={note.id} className="notes-item">
                                <div className="notes-item-content">
                                    <h3>{note.title}</h3>
                                    <p>{note.content}</p>
                                </div>
                                <div className="notes-item-actions">
                                    <button 
                                        onClick={() => handleEdit(note)} 
                                        className="edit-button"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => deleteNote(note.id)} 
                                        className="delete-button"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default NotesApp;