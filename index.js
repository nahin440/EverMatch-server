const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
   console.log("Pinged your deployment. You successfully connected to MongoDB!");
   
   const bioCollection = client.db('WeddingDb').collection('biodata');
   const userCollection = client.db('WeddingDb').collection('users');
   const fvrtCollection = client.db('WeddingDb').collection('favourites');
   const paymentCollection = client.db('WeddingDb').collection('payments');
   const contactRequestCollection = client.db('WeddingDb').collection('requests');
   const premiumCollection = client.db('WeddingDb').collection('premrequests');
   const successStoryCollection = client.db('WeddingDb').collection('successstory');



   
   // jwt related api
app.post('/jwt', async (req, res) => {
 // console.log(req.headers)
 const user = req.body;
 console.log("Received request at /jwt with body: ", user);
 const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
 
 res.send({ token });
})

// middlewares 
const verifyToken = (req, res, next) => {
 // console.log('inside verify token', req.headers.authorization);
 if (!req.headers.authorization) {
   return res.status(401).send({ message: 'unauthorized access' });
 }
 const token = req.headers.authorization.split(' ')[1];
 jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
   if (err) {
     return res.status(401).send({ message: 'unauthorized access' })
   }
   req.decoded = decoded;
   next();
 })
}

// use verify admin after verifyToken
const verifyAdmin = async (req, res, next) => {
 const email = req.decoded.email;
 const query = { email: email };
 const user = await userCollection.findOne(query);
 const isAdmin = user?.role === 'admin';
 if (!isAdmin) {
   return res.status(403).send({ message: 'forbidden access' });
 }
 next();
}

// const verifyPremium = async (req, res, next) => {
//   const email = req.decoded.email;
//   const query = { email: email };
//   const user = await userCollection.findOne(query);
//   const isPremium = user?.role === 'premium';
//   if (!isPremium) {
//     return res.status(403).send({ message: 'forbidden access' });
//   }
//   next();
// }

   // users related api
   app.get('/users',verifyToken, verifyAdmin, async (req, res) => {
     const result = await userCollection.find().toArray();
     res.send(result);
   });
 
   app.get('/users/admin/:email', verifyToken, async (req, res) => {
     const email = req.params.email;

     if (email !== req.decoded.email) {
       return res.status(403).send({ message: 'forbidden access' })
     }

     const query = { email: email };
     const user = await userCollection.findOne(query);
     let admin = false;
     if (user) {
       admin = user?.role === 'admin';
     }
     res.send({ admin });
   })
   app.get('/users/premium/:email', verifyToken, async (req, res) => {
     const email = req.params.email;

     if (email !== req.decoded.email) {
       return res.status(403).send({ message: 'forbidden access' })
     }

     const query = { email: email };
     const user = await userCollection.findOne(query);
     let premium = false;
     if (user) {
       premium = user?.role === 'premium';
     }
     res.send({ premium });
   })

   app.post('/users', async (req, res) => {
     const user = req.body;
     // insert email if user doesnt exists: 
     // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
     const query = { email: user.email }
     const existingUser = await userCollection.findOne(query);
     if (existingUser) {
       return res.send({ message: 'user already exists', insertedId: null })
     }
     const result = await userCollection.insertOne(user);
     res.send(result);
   });
   // app.get('/users/admin/:email', async (req, res) => {
   //   const email = req.params.email;
   
   //   if (email !== req.decoded.email) {
   //     return res.status(403).send({ message: 'forbidden access' })
   //   }

   //   const query = { email: email };
   //   const user = await userCollection.findOne(query);
   //   let admin = false;
   //   if (user) {
   //     admin = user?.role === 'admin';
   //   }
   //   res.send({ admin });
   // })
   app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
     const id = req.params.id;
     const filter = { _id: new ObjectId(id) };
     const updatedDoc = {
       $set: {
         role: 'admin'
       }
     }
     const result = await userCollection.updateOne(filter, updatedDoc);
     res.send(result);
   })
   app.patch('/users/premium/:id', async (req, res) => {
     const id = req.params.id;
     const filter = { _id: new ObjectId(id) };
     const updatedDoc = {
       $set: {
         role: 'premium'
       }
     }
     const result = await userCollection.updateOne(filter, updatedDoc);
     res.send(result);
   })
   // Create Biodata
   app.post('/biodatas', async (req, res) => {
     const biodata = req.body;
   
     try {
       // Check if biodata already exists for the given contactEmail
       const existingBiodata = await bioCollection.findOne({ contactEmail: biodata.contactEmail });
   
       if (existingBiodata) {
         return res.status(400).send({
           success: false,
           message: 'Biodata already exists for this contact email. Please use the update feature.',
         });
       }
   
       // Fetch the last biodata to get the last biodataId
       const lastBiodata = await bioCollection.find().sort({ biodataId: -1 }).limit(1).toArray();
       const lastId = lastBiodata.length > 0 ? lastBiodata[0].biodataId : 0;
   
       // Assign a new biodata ID
       biodata.biodataId = lastId + 1;
   
       // Insert the new biodata
       const result = await bioCollection.insertOne(biodata);
   
       res.send({ success: true, biodataId: biodata.biodataId });
     } catch (error) {
       console.error('Error adding biodata:', error);
       res.status(500).send({ success: false, message: 'Failed to add biodata' });
     }
   });
   

   app.get('/biodatadetail/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Received ID:', id);  // Log the received ID
  
    try {
      // Ensure that the ID is a valid ObjectId
      const objectId = new ObjectId(id);  // Convert string ID to ObjectId
      
      // Log the ObjectId to check if it's correct
      console.log('Converted ObjectId:', objectId);
  
      // Query the MongoDB collection for the biodata with the given ObjectId
      const biodata = await bioCollection.findOne({ _id: objectId });
      console.log('Biodata found:', biodata); // Log the biodata if found
  
      if (!biodata) {
        return res.status(404).json({ error: 'Biodata not found' });
      }
  
      res.json(biodata);  // Send the biodata object as the response
    } catch (error) {
      console.error('Error converting ObjectId:', error);
      return res.status(400).json({ error: 'Invalid ID format' });
    }
  });

  


   app.get('/biodata', async (req, res) => {
     const { biodataType, limit } = req.query;
   
     try {
       const query = biodataType ? { biodataType } : {}; // Filter by biodataType if provided
       const limitNumber = limit ? parseInt(limit) : 0; // Convert limit to number (default: 0 for no limit)
   
       const biodatas = await bioCollection.find(query).limit(limitNumber).toArray();
       res.json(biodatas); // Send the filtered biodata
     } catch (error) {
       console.error('Error fetching biodata:', error);
       res.status(500).json({ error: 'Internal server error' });
     }
   });

   app.post('/favourites', async (req, res) => {
     const user = req.body;
     // insert email if user doesnt exists: 
     // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
     const query = { email: user.biodataId }
     const existingUser = await fvrtCollection.findOne(query);
     if (existingUser) {
       return res.send({ message: ' and it was already exists', insertedId: null })
     }
     
     const result = await fvrtCollection.insertOne(user);
     res.send(result);
   });
 

   app.get('/favourites/:email', async (req, res) => {
     const { email } = req.params;
   
     try {
       const favourites = await fvrtCollection.find({ email }).toArray();
       res.json(favourites);
     } catch (error) {
       console.error('Error fetching favourites:', error);
       res.status(500).json({ error: 'Failed to fetch favourites' });
     }
   });

   app.delete('/favourites/:id', async (req, res) => {
     const { id } = req.params; // Extract the _id from the request parameters
   
     try {
       // Convert the provided id into a MongoDB ObjectId
       const objectId = new ObjectId(id);
   
       // Perform the delete operation
       const result = await fvrtCollection.deleteOne({ _id: objectId });
   
       // Check if the document was deleted
       if (result.deletedCount === 0) {
         return res.status(404).send({ message: 'Document not found in favourites' });
       }
   
       // Success response
       res.send({ message: 'Document removed from favourites successfully' });
     } catch (error) {
       console.error('Error deleting document:', error);
       res.status(500).send({ error: 'Failed to delete document' });
     }
   });
   
   
   
   
   
     // payment intent
     app.post('/create-payment-intent', async (req, res) => {
       const { price } = req.body;
       const amount = parseInt(price * 100);
       console.log(amount, 'amount inside the intent')
 
       const paymentIntent = await stripe.paymentIntents.create({
         amount: amount,
         currency: 'usd',
         payment_method_types: ['card']
       });
 
       res.send({
         clientSecret: paymentIntent.client_secret
       })
     });
     //...................................................................................................
     app.post('/payments', async (req, res) => {

       const payment = req.body;
      //  const id = req.params.biodataIdd;
       const paymentResult = await paymentCollection.insertOne(payment);
       console.log('payment info', payment);
       const contactRequest = {
         name:payment.name,
         biodataId: payment.biodataId,
         email: payment.email,
         transactionId: payment.transactionId,
         status: 'pending', // Default status for admin approval
         date: new Date(),
        };
 
     const contactRequestResult = await contactRequestCollection.insertOne(contactRequest);
       res.send({ paymentResult});
     })
     app.patch('/contact-requests/:id', async (req, res) => {
       const id = req.params.id;
       const { status } = req.body; // e.g., "approved" or "rejected"
       const filter = { _id: new ObjectId(id) };
       const updateDoc = { $set: { status } };
   
       const result = await contactRequestCollection.updateOne(filter, updateDoc);
       res.send(result);
   });
//    app.get('/my-contact-requests', async (req, res) => {
//      try {
//          const userEmail = req.query.email;  // Get email from query parameter
//          if (!userEmail) {
//              return res.status(400).send({ message: "Email is required" });
//          }
 
//          // Filter the requests by the user's email
//          const requests = await contactRequestCollection.find({ email: userEmail }).toArray();
         
//          res.send(requests);
//      } catch (error) {
//          console.error("Error fetching contact requests:", error);
//          res.status(500).send("Error fetching data");
//      }
//  });

app.get('/my-contact-requests', async (req, res) => {
  const { email } = req.query; // Optional: filter by email if needed

  try {
      // Create the base query object
      const query = {};
      
      // If email is provided in the query, filter by it
      if (email) query.email = email;

      // Fetch all contact requests based on the query
      const allRequests = await contactRequestCollection.find(query).toArray();

      // Send all contact requests back as a response
      res.status(200).send(allRequests);
  } catch (error) {
      console.error("Error fetching contact requests:", error);
      res.status(500).send({
          message: "Error fetching contact requests",
          error: error.message,
      });
  }
});


// Backend (Express route to approve a contact request)

app.patch('/contact-requests/:id', async (req, res) => {
 const id = req.params.id;  // Get the request ID from the URL parameter
 const { status } = req.body;  // Get the new status from the request body (approved or rejected)

 // Ensure that the status is "approved"
 if (status !== 'approved') {
     return res.status(400).send({ message: 'Invalid status. Only "approved" is allowed.' });
 }

 try {
     // Find the contact request by ID and update its status
     const filter = { _id: new ObjectId(id) };
     const updateDoc = { $set: { status: 'approved' } };

     const result = await contactRequestCollection.updateOne(filter, updateDoc);
     
     if (result.matchedCount === 0) {
         return res.status(404).send({ message: 'Contact request not found.' });
     }

     res.status(200).send({ message: 'Contact request approved successfully!' });
 } catch (error) {
     console.error('Error updating contact request status:', error);
     res.status(500).send({ message: 'Something went wrong. Please try again later.' });
 }
});
  
 app.delete('/contact-requests/:id', async (req, res) => {
   const id = req.params.id;

   try {
       const result = await contactRequestCollection.deleteOne({ _id: new ObjectId(id) });

       if (result.deletedCount > 0) {
           res.send({ message: "Contact request deleted successfully", deletedCount: result.deletedCount });
       } else {
           res.status(404).send({ message: "Contact request not found" });
       }
   } catch (error) {
       console.error("Error deleting contact request:", error);
       res.status(500).send({ message: "An error occurred while deleting the contact request" });
   }
});
//.............................................................................................
         // stats or analytics
   app.get('/admin-stats', verifyToken, verifyAdmin, async (req, res) => {
     // const biodatas = await bioCollection.estimatedDocumentCount();
     // const menuItems = await menuCollection.estimatedDocumentCount();
     const orders = await paymentCollection.estimatedDocumentCount();

     // this is not the best way
     // const payments = await paymentCollection.find().toArray();
     // const revenue = payments.reduce((total, payment) => total + payment.price, 0);

     const result = await paymentCollection.aggregate([
       {
         $group: {
           _id: null,
           totalRevenue: {
             $sum: '$price'
           }
         }
       }
     ]).toArray();

     const revenue = result.length > 0 ? result[0].totalRevenue : 0;

     res.send({
       // biodatas,
       // menuItems,
       // orders,
       revenue
     })
   })
   
   
   
   


   // Edit Biodata (PATCH)
   app.put('/biodatas/:id', verifyToken, async (req, res) => {
     try {
       const { id } = req.params;
       const updatedData = req.body;
       delete updatedData._id;
   
       // Update biodata using the biodataId
       const result = await bioCollection.updateOne(
         { biodataId: parseInt(id) },  // We use biodataId for searching, assuming it's an integer
         { $set: updatedData } // The updated data will be set
       );
   
       if (result.modifiedCount === 0) {
         return res.status(404).json({ message: 'Biodata not found' });
       }
   
       res.status(200).json({ success: true, message: 'Biodata updated successfully' });
     } catch (err) {
       console.error('Error updating biodata:', err);
       res.status(500).json({ message: 'Server error' });
     }
   });



   // Fetch biodata by email
   app.get('/biodatas/:email', async (req, res) => {
     const email = req.params.email;
   
     try {
       const biodata = await bioCollection.findOne({ contactEmail: email });
   
       if (!biodata) {
         return res.status(404).json({ message: 'Biodata not found' });
       }
   
       res.json(biodata);
     } catch (err) {
       console.error('Error fetching biodata:', err);
       res.status(500).json({ message: 'Error fetching biodata' });
     }
   });

   // Fetch all biodatas 
   app.get('/biodatas', async (req, res) => {
    try {
      const result = await bioCollection.find().toArray();
      res.send(result);
    } catch (err) {
      console.error('Error fetching biodatas:', err);
      res.status(500).json({ message: 'Error fetching biodatas' });
    }
  });
  

// Mark biodata as premium..............................................................
// app.post('/biodatas/make-premium/:id', (req, res) => {
//   const biodataId = req.params.id;
//   db.query('UPDATE biodatas SET isPremium = TRUE WHERE id = ?', [biodataId], (err, result) => {
//     if (err) {
//       console.error('Error marking biodata as premium:', err);
//       return res.status(500).json({ message: 'Error marking biodata as premium' });
//     }
//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: 'Biodata not found' });
//     }
//     res.json({ message: 'Biodata marked as premium' });
//   });
// });

// POST route to approve a premium request
app.post('/premium-requests/:email/:biodataId', verifyToken, async (req, res) => {
  const email = req.params.email; // Get the email from the route parameter
  const biodataId = req.params.biodataId;
 
 
  // Construct the premium request object
  const premiumRequest = {
    biodataId,
    email,
    status: 'pending', // Default status for admin approval
  };

  try {
    // Check if a premium request already exists for this email
    const existingRequest = await premiumCollection.findOne({ email });

    if (existingRequest) {
      // If a request already exists, send a message indicating it's already applied
      return res.status(400).send({ 
        message: 'You have already applied for a premium request.',
        existingRequest,
      });
    }

    // If no existing request, insert the new premium request into the collection
    const premiumRequestResult = await premiumCollection.insertOne(premiumRequest);

    // Send a successful response
    res.status(200).send({ 
      message: 'Premium request submitted successfully.',
      premiumRequestResult 
    });
  } catch (error) {
    console.error('Error inserting premium request:', error);
    res.status(500).send({ message: 'Failed to submit premium request.' });
  }
});

app.get('/premiumRequests', verifyToken, async (req, res) => {
  try {
    // Fetch all pending requests from the database
    const pendingRequests = await premiumCollection.find({ status: 'pending' }).toArray();

    // Send the pending requests back to the client
    res.status(200).send(pendingRequests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);

    // Send a server error response
    res.status(500).send({ message: 'Failed to fetch pending requests.' });
  }
});

app.patch('/premium-requests/:id', verifyToken, async (req, res) => {
  const id = req.params.id; // The premium request ID
  const { status } = req.body; // Status sent in the request body (e.g., "approved")

  try {
    // Find the premium request by its ID
    const premiumRequest = await premiumCollection.findOne({ _id: new ObjectId(id) });

    if (!premiumRequest) {
      return res.status(404).send({ message: 'Premium request not found.' });
    }

    // Update the status of the premium request in the premiumCollection
    await premiumCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status || 'approved' } }
    );

    // Use the email from the premium request to update the biodata role
    const userEmail = premiumRequest.email;
    const updateBio = await bioCollection.updateOne(
      { contactEmail: userEmail }, // Match the email in the bioCollection
      { $set: { role: 'premium' } } // Update the role to "premium"
    );

    // Check if the biodata was successfully updated
    if (updateBio.modifiedCount === 0) {
      return res.status(400).send({ message: 'Failed to update biodata role.' });
    }

    // Send a successful response
    res.status(200).send({ message: 'Biodata approved as premium' });

  } catch (error) {
    console.error('Error approving premium request:', error);
    res.status(500).send({ message: 'Failed to approve premium request.' });
  }
});
//get 6 premium user
app.get('/premium-memberss', async (req, res) => {
  try {
    // Fetch six premium members from bioCollection
    const premiumMembers = await bioCollection
      .find({ role: 'premium' }) // Filter only premium members
      .limit(6) // Limit the result to six members
      .toArray(); // Convert the result to an array

    // Map the result to include only the required fields for the profile cards
    const memberProfiles = premiumMembers.map((member) => ({
      _id : member._id || 'N/A',
      biodataId: member.biodataId || 'N/A', // Default to 'N/A' if biodataId is missing
      biodataType: member.biodataType || 'N/A',
      profileImage: member.profileImage || 'https://via.placeholder.com/150', // Default placeholder image
      permanentDivision: member.permanentDivision || 'N/A',
      age: member.age || 'N/A',
      occupation: member.occupation || 'N/A',
    }));

    // Send the member profiles to the client
    res.status(200).send(memberProfiles);
  } catch (error) {
    console.error('Error fetching premium members:', error);
    res.status(500).send({ message: 'Failed to fetch premium members.' });
  }
});

//post success story
app.post("/successStories", verifyToken, async (req, res) => {
  try {
    const successStory = req.body;

    if (
      !successStory.selfBiodataId ||
      !successStory.partnerBiodataId ||
      !successStory.coupleImage ||
      !successStory.successStory
    ) {
      return res
        .status(400)
        .send({ success: false, message: "All fields are required." });
    }

    const result = await successStoryCollection.insertOne(successStory);
    res.send({ success: true, message: "Success story added.", data: result });
  } catch (error) {
    console.error("Error adding success story:", error);
    res
      .status(500)
      .send({ success: false, message: "Failed to add success story." });
  }
});

//get success story
app.get("/successStories", async (req, res) => {
  try {
    const stories = await successStoryCollection.find().toArray();
    res.send({ success: true, data: stories });
  } catch (error) {
    console.error("Error fetching success stories:", error);
    res
      .status(500)
      .send({ success: false, message: "Failed to fetch success stories." });
  }
});

app.get("/biodataStats", async (req, res) => {
  try {
    const totalBiodata = await bioCollection.countDocuments();
    const totalGirls = await bioCollection.countDocuments({ biodataType: "Female" });
    const totalBoys = await bioCollection.countDocuments({ biodataType: "Male" });
    res.send({
      success: true,
      data: {
        totalBiodata,
        totalGirls,
        totalBoys,
      },
    });
  } catch (error) {
    console.error("Error fetching biodata stats:", error);
    res.status(500).send({
      success: false,
      message: "Failed to fetch biodata stats.",
    });
  }
});
app.get("/marriageStats", async (req, res) => {
  try {
    const totalMarriages = await successStoryCollection.countDocuments();
    res.send({
      success: true,
      data: {
        totalMarriages,
      },
    });
  } catch (error) {
    console.error("Error fetching marriage stats:", error);
    res.status(500).send({
      success: false,
      message: "Failed to fetch marriage stats.",
    });
  }
});



} finally {
  // Ensures that the client will close when you finish/error
  // await client.close();
}
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Matrimony management system');
});

app.listen(port, () => {
  console.log(`System is waiting at the: ${port}`);
});

