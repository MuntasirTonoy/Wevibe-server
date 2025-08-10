require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
    // await client.connect();

    const eventCollection = client.db("we-vibe").collection("events");
    const commentCollection = client.db("we-vibe").collection("comments");

    // Create Event
    app.post("/events", async (req, res) => {
      const newEvent = req.body;
      const result = await eventCollection.insertOne({
        ...newEvent,
        joinedUsers: [], // Ensure it's always initialized
      });
      res.send(result);
    });

    // Get All Events (or filter by author email)
    app.get("/events", async (req, res) => {
      try {
        const { author } = req.query;
        const query = author ? { "author.email": author } : {};
        const result = await eventCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        console.error("❌ Failed to fetch events:", err);
        res.status(500).send({ error: "Failed to fetch events" });
      }
    });

    // Get Single Event by ID
    app.get("/events/:id", async (req, res) => {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid ID format" });
      }
      const result = await eventCollection.findOne({ _id: new ObjectId(id) });
      if (!result) {
        return res.status(404).send({ error: "Event not found" });
      }
      res.send(result);
    });

    // Delete Event by ID
    app.delete("/events/:id", async (req, res) => {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid ID format" });
      }
      const result = await eventCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Update Event by ID
    app.put("/events/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedEvent = req.body;

        const result = await eventCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedEvent }
        );

        res.send(result);
      } catch (err) {
        res.status(500).send({ error: "Failed to update event" });
      }
    });

    // Join or Unjoin Event (Toggle)
    app.patch("/join-event", async (req, res) => {
      const { eventId, userEmail } = req.body;

      const event = await eventCollection.findOne({
        _id: new ObjectId(eventId),
      });
      if (!event)
        return res
          .status(404)
          .send({ success: false, message: "Event not found" });

      const alreadyJoined = event.joinedUsers?.includes(userEmail);

      if (alreadyJoined) {
        await eventCollection.updateOne(
          { _id: new ObjectId(eventId) },
          { $pull: { joinedUsers: userEmail } }
        );
        return res.send({
          success: true,
          joined: false,
          message: "Unjoined the event",
        });
      } else {
        await eventCollection.updateOne(
          { _id: new ObjectId(eventId) },
          { $addToSet: { joinedUsers: userEmail } }
        );
        return res.send({
          success: true,
          joined: true,
          message: "Joined the event",
        });
      }
    });
    // Add Comment
    app.post("/events/:id/comments", async (req, res) => {
      const { id } = req.params;
      const { author, text } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid event ID" });
      }
      if (!author?.email || !text) {
        return res.status(400).send({ error: "Author and text are required" });
      }

      const comment = {
        eventId: new ObjectId(id),
        author,
        text,
        createdAt: new Date(),
      };

      const result = await commentCollection.insertOne(comment);
      res.send(result);
    });

    // Get Comments for an Event (with pagination)
    app.get("/events/:id/comments", async (req, res) => {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid event ID" });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const comments = await commentCollection
        .find({ eventId: new ObjectId(id) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

      res.send(comments);
    });

    // Delete Comment (only by author)
    app.delete("/comments/:commentId", async (req, res) => {
      const { commentId } = req.params;
      const { email } = req.query;

      if (!ObjectId.isValid(commentId)) {
        return res.status(400).send({ error: "Invalid comment ID" });
      }
      if (!email) {
        return res.status(400).send({ error: "Email is required" });
      }

      const comment = await commentCollection.findOne({
        _id: new ObjectId(commentId),
      });
      if (!comment) {
        return res.status(404).send({ error: "Comment not found" });
      }
      if (comment.author.email !== email) {
        return res
          .status(403)
          .send({ error: "You are not allowed to delete this comment" });
      }

      const result = await commentCollection.deleteOne({
        _id: new ObjectId(commentId),
      });
      res.send(result);
    });

    // Get event Specific User
    app.get("/joined-events", async (req, res) => {
      const { email } = req.query;
      const events = await eventCollection
        .find({ joinedUsers: email })
        .toArray();
      res.send(events);
    });

    // await client.db("admin").command({ ping: 1 });
    // console.log("✅ Connected to MongoDB and server is ready!");
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err);
  }
}

run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello World! server ready");
});

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
