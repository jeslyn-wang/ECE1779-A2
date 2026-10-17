const express = require("express");
const { Pool } = require("pg");
const { createClient } = require("redis");

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Note: This application requires Docker Compose to set environment variables
// (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, REDIS_HOST, REDIS_PORT).
// Run with `docker compose up --build -d`, not `npm start` directly.

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Redis connection
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

// Handle Redis connection errors
redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

// Initialize taskCount in Redis if it is missing
async function initializeTaskCount() {
  // TODO:
  // Check whether "taskCount" exists in Redis.
  // If it does not, initialize it from the current number of tasks
  // stored in PostgreSQL.
  const exists = await redisClient.exists("taskCount");
  if (!exists) {
    const result = await pool.query("SELECT COUNT(*) FROM tasks");
    await redisClient.set("taskCount", result.rows[0].count);
  }
}

// POST /tasks: Create a new task
app.post("/tasks", async (req, res) => {
  // Input format: { title, description, status }
  // TODO:
  // - Check that "title" is provided in the request body.
  //   - If missing, respond with HTTP 400 and
  //     { error: "Title is required" }.
  // - If "description" or "status" is omitted, use "" as the default value.
  const { title, description = "", status = "" } = req.body;
  if (!title){
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    // TODO:
    // - Validate the required input.
    // - Ensure "taskCount" is initialized before updating it.
    // - Store the new task in PostgreSQL.
    // - Update "taskCount" in Redis.
    // - Respond with the required status and JSON body.
    await initializeTaskCount();
    const result = await pool.query(
      "INSERT INTO tasks (data) VALUES ($1) RETURNING id",
      [JSON.stringify({ title, description, status })]
    );
    await redisClient.incr("taskCount");
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /tasks: Retrieve all tasks
app.get("/tasks", async (req, res) => {
  try {
    // TODO:
    // Retrieve all tasks from PostgreSQL and return them in the
    // response format specified in the assignment handout.
    const result = await pool.query("SELECT id, data FROM tasks ORDER BY id");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /tasks/:id: Retrieve a task by ID
app.get("/tasks/:id", async (req, res) => {
  try {
    // TODO:
    // Retrieve the requested task from PostgreSQL.
    // Return the task if it exists, or the required 404 response otherwise.
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /tasks/:id: Update a task by ID (supports partial update)
app.put("/tasks/:id", async (req, res) => {
  try {
    // TODO:
    // Retrieve the existing task.
    // Update only the fields provided in the request body and preserve
    // the existing values of omitted fields.
    // Save and return the updated task.
    // Return the required 404 response if the task does not exist.
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /tasks/:id: Delete a task by ID
app.delete("/tasks/:id", async (req, res) => {
  try {
    // TODO:
    // - Ensure "taskCount" is initialized before updating it.
    // - Delete the task from PostgreSQL.
    // - If the task existed, update "taskCount" in Redis and return 204.
    // - Otherwise, return the required 404 response.
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /stats: Retrieve cached task count
app.get("/stats", async (req, res) => {
  try {
    // TODO:
    // Ensure "taskCount" is initialized, retrieve it from Redis,
    // and return it in the response format specified in the handout.
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Start the API after connecting to Redis.
// This setup is provided and does not need to be modified.
async function start() {
  await redisClient.connect();

  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error("Startup failed", err);
  process.exit(1);
});
