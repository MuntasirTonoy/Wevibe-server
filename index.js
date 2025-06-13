const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware to handle errors
app.get("/", (req, res) => {
  res.send("Hello World! server ready");
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@we-vibe-cluster.r3lgiau.mongodb.net/?retryWrites=true&w=majority&appName=we-vibe-cluster`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const eventCollection = client.db("we-vibe").collection("events");

    //  upload data
    app.post("/events", async (req, res) => {
      const newEvent = req.body;
      const result = await eventCollection.insertOne(newEvent);
      res.send(result);
    });

    // LOAD ALL  COLLECTION   DATA
    app.get("/events", async (req, res) => {
      const result = await eventCollection.find().toArray();
      res.send(result);
    });

    // LOAD SPECIFIC  DATA BY IT'S ID
    app.get(`/events/:id`, async (req, res) => {
      const result = await eventCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });
    //  DELETE
    app.delete("/events/:id", async (req, res) => {
      const result = await eventCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
