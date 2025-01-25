const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000;

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

















    app.get("/biodata", async (req, res) => {
      const result = await biodataCollection.find().toArray();
      res.send(result);
    })








    // Add or Edit Biodata


    app.post('/biodata', async (req, res) => {
      const biodata = req.body;

      try {

        const lastBiodata = await biodataCollection.findOne({}, { sort: { IndexId: -1 } });
        const newIndexId = lastBiodata ? lastBiodata.IndexId + 1 : 1;


        if (biodata._id) {
          const filter = { _id: new ObjectId(biodata._id) };
          const updateDoc = {
            $set: {
              IndexId: biodata.IndexId || newIndexId,
              BiodataType: biodata.BiodataType,
              Name: biodata.Name,
              ProfileImage: biodata.ProfileImage,
              DateOfBirth: biodata.DateOfBirth,
              Height: biodata.Height,
              Weight: biodata.Weight,
              Age: biodata.Age,
              Occupation: biodata.Occupation,
              Race: biodata.Race,
              FathersName: biodata.FathersName,
              MothersName: biodata.MothersName,
              PermanentDivision: biodata.PermanentDivision,
              PresentDivision: biodata.PresentDivision,
              ExpectedPartnerAge: biodata.ExpectedPartnerAge,
              ExpectedPartnerHeight: biodata.ExpectedPartnerHeight,
              ExpectedPartnerWeight: biodata.ExpectedPartnerWeight,
              ContactEmail: biodata.ContactEmail,
              MobileNumber: biodata.MobileNumber
            }
          };

          const result = await biodataCollection.updateOne(filter, updateDoc);
          res.send({ success: true, message: 'Biodata updated successfully', result });
        } else {
          // Otherwise, it's a create operation
          const newBiodata = {
            IndexId: newIndexId,
            BiodataType: biodata.BiodataType,
            Name: biodata.Name,
            ProfileImage: biodata.ProfileImage,
            DateOfBirth: biodata.DateOfBirth,
            Height: biodata.Height,
            Weight: biodata.Weight,
            Age: biodata.Age,
            Occupation: biodata.Occupation,
            Race: biodata.Race,
            FathersName: biodata.FathersName,
            MothersName: biodata.MothersName,
            PermanentDivision: biodata.PermanentDivision,
            PresentDivision: biodata.PresentDivision,
            ExpectedPartnerAge: biodata.ExpectedPartnerAge,
            ExpectedPartnerHeight: biodata.ExpectedPartnerHeight,
            ExpectedPartnerWeight: biodata.ExpectedPartnerWeight,
            ContactEmail: biodata.ContactEmail,
            MobileNumber: biodata.MobileNumber
          };

          const result = await biodataCollection.insertOne(newBiodata);
          res.send({ success: true, message: 'Biodata created successfully', result });
        }
      } catch (error) {
        console.error('Error creating or updating biodata:', error);
        res.status(500).send({ success: false, message: 'Failed to process biodata', error });
      }
    });















    // favourite collections

    app.post('/favourites', async (req, res) => {
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














app.get('/', (req, res) => {
  res.send('wedding season is coming')
})

app.listen(port, () => {
  console.log(`wedding is going on port ${port}`)
})