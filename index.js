const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000 ;

// middleware

app.use(cors());
app.use(express.json());












const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.slbhc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const biodataCollection = client.db("WeddingDb").collection("Biodata")
    const favouriteCollection = client.db("WeddingDb").collection("favourites")















    

    app.get("/biodata", async (req,res) => {
        const result = await biodataCollection.find().toArray();
        res.send(result);
    })






















    // favourite collections

    app.post('/favourites', async (req,res) => {
      const favouriteBiodata = req.body;
      const result = await favouriteCollection.insertOne(favouriteBiodata);
      res.send(result);
    })




    app.get('/favourites', async (req, res) => {
      try {
        const result = await favouriteCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch favourites', error });
      }
    });



    app.delete('/favourites/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await favouriteCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to delete favourite', error });
      }
    });
    
    








    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);














app.get('/', (req,res) => {
    res.send('wedding season is coming')
})

app.listen(port, ()=> {
    console.log(`wedding is going on port ${port}`)
})