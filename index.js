const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World! server ready");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@we-vibe-cluster.r3lgiau.mongodb.net/?retryWrites=true&w=majority&appName=we-vibe-cluster`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const eventCollection = client.db("we-vibe").collection("events");

    //  Upload data
    app.post("/events", async (req, res) => {
      const newEvent = req.body;
      const result = await eventCollection.insertOne(newEvent);
      res.send(result);
    });

    //  Load all events
    app.get("/events", async (req, res) => {
      const result = await eventCollection.find().toArray();
      res.send(result);
    });

    //  Load specific event by ID
    app.get("/events/:id", async (req, res) => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid ID format" });
      }

      try {
        const result = await eventCollection.findOne({ _id: new ObjectId(id) });

        if (!result) {
          return res.status(404).send({ error: "Event not found" });
        }

        res.send(result);
      } catch (err) {
        console.error("Error fetching event:", err);
        res.status(500).send({ error: "Server error while fetching event" });
      }
    });

    //  Delete event
    app.delete("/events/:id", async (req, res) => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid ID format" });
      }

      const result = await eventCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB and server is ready!");
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
