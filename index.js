require('dotenv').config();
const express = require('express')
const cors = require('cors')
const app = express()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = 5000

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json())
app.use(cookieParser());


app.get('/', (req, res) => {
  res.send('Hello World!')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lum0bq6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

var admin = require("firebase-admin");
var serviceAccount = require("./service-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const VerifyToken = async(req,res,next)=>{
  const useAuth = req.headers?.authorization

  if(!useAuth || !useAuth.startsWith('Bearer ')){
    return res.status(401).send({message:"Unauthrozied"})
  }

  const token = useAuth.split(' ')[1]

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    console.log('Decoded User', decoded);
    
    req.decode = decoded ;
    next()
    
  } catch (error) {
     console.error("Token verification failed:", error);
    return res.status(403).send({ message: "Forbidden" });
  }
   
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    // middaleWare setUp 

      app.post('/jwt' , async(req,res)=>{

        const user = req.body
        const token = jwt.sign(user,process.env.JWT_SECRET,{expiresIn:'1h'})
       
        res.cookie('access-token',token,{
          httpOnly:true ,
          secure:false
        })

        res.send({ success: true });
       
        
      })

// ................................................................................................ 
    const userCollection = client.db('ABCD').collection('XYZ')
    const ApplyCollection = client.db('ABCD').collection('LMN')

    app.get('/user', VerifyToken ,async(req,res)=>{
       const user = req.query.email 

       let query = {}
       if(user){
        query = { hr_email:user }
       }

      

        const data =await userCollection.find(query).toArray()
        res.send(data)
    })

    app.get('/user/:id',async(req,res)=>{
        const data = req.params.id 
        const match = {_id : new ObjectId(data)}
        const result = await userCollection.findOne(match)
        res.send(result)
    })


   app.post('/user',async(req,res)=>{
      const data = req.body 
      const result = await userCollection.insertOne(data)
      res.send(result)
   })


    // ApplyCollection .....................

    app.post('/apply',async(req,res)=>{
        const data = req.body
        const result = await ApplyCollection.insertOne(data)
        res.json(result)
    })

    app.get('/apply',VerifyToken ,async(req,res)=>{
      const data = req.query.email 
     
      if(data !== req.decode.email){
            return res.status(403).send({ message: "Forbidden: Email mismatch" });
      }
 
      const match = {email:data}
      const result = await ApplyCollection.find(match).toArray()
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
