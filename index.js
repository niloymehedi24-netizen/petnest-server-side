const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const dotenv = require('dotenv');
const cors = require("cors")
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const uri = process.env.MONGODB_URI;

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const verifyToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization
    if(!authHeader){
        return res.status(401).json({message: "Unauthorized user logged in"})
    }

    const token = authHeader.split(" ")[1]
    if(!token){
        return res.status(401).json({message: "Unauthorized user logged in"})
    }

    try {
        const {payload} = await jwtVerify(token, JWKS)
        console.log(payload);
        next();
    } catch (error) {
        return res.status(403).json({message: "Forbidden"})
    }
}

async function run() {
  try {
    
    // await client.connect();

    const db = client.db("petnest")

    const petCollection = db.collection("pets");

    const adoptCollection = db.collection("adopts");

    app.get("/featured", async (req, res) => {
    const result = await petCollection.find().limit(6).toArray();
    res.json(result);
    }); 

    app.get('/pet', async(req, res ) => {
        const result = await petCollection.find().toArray()
        res.json(result); 
    })

    app.post('/pet', verifyToken, async (req, res) => {
        const petData = req.body
        console.log(petData);
        const result = await petCollection.insertOne(petData)
        res.json(result);
    })

    // middleware

    app.get('/pet/:id', verifyToken, async (req, res) => {
        const {id} = req.params

        const result = await petCollection.findOne({_id: new ObjectId(id)})
        res.json(result);
    })

    app.patch('/pet/:id', verifyToken, async (req, res) => {
        const {id} = req.params
        const updatedData = req.body

        const result = await petCollection.updateOne(
            {_id: new ObjectId(id)},
            {$set: updatedData}
        )
        res.json(result);
    })

    app.delete('/pet/:id', async (req, res) => {
        const {id} = req.params
        const result = await petCollection.deleteOne({_id: new ObjectId(id)})
        res.json(result);
    })

    app.get("/adopt/user/:userId", async (req, res) => {
        const { userId } = req.params;
        const result = await adoptCollection.find({ userId }).sort({ createdAt: -1 }).toArray();

        res.send(result);
    });

    app.post('/adopt', verifyToken, async (req, res) => {
        const adoptData = req.body
        const result = await adoptCollection.insertOne(adoptData)
        res.json(result);
    })

    app.delete('/adopt/:id', verifyToken, async (req, res) => {
        const {id} = req.params
        const result = await adoptCollection.deleteOne({_id: new ObjectId(id)})
        res.json(result);
    })
    
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server is running fine!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});