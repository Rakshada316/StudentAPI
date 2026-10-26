require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json({ limit: "10kb" }));

const PORT = process.env.PORT || 3000;

// Record schema
const recordSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: 100,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email"]
    },
    course: {
      type: String,
      required: [true, "Course is required"],
      trim: true,
      maxlength: 100
    }
  },
  { timestamps: true, strict: "throw" }
);

const Record = mongoose.model("Record", recordSchema);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "StudentAPI is running" });
});

// CREATE: Add a record
app.post("/api/records", async (req, res) => {
  try {
    const record = await Record.create(req.body);
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: "Invalid record data" });
  }
});

// READ: Get all records
app.get("/api/records", async (req, res) => {
  try {
    const records = await Record.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Could not retrieve records" });
  }
});

// READ: Get one record by ID
app.get("/api/records/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid record ID" });
    }

    const record = await Record.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: "Could not retrieve record" });
  }
});

// UPDATE: Update a record by ID
app.put("/api/records/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid record ID" });
    }

    const record = await Record.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
        overwrite: true
      }
    );

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(record);
  } catch (error) {
    res.status(400).json({ error: "Invalid update data" });
  }
});

// DELETE: Delete a record by ID
app.delete("/api/records/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid record ID" });
    }

    const record = await Record.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Could not delete record" });
  }
});

// Start server only after database connection succeeds
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`StudentAPI running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();