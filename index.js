require("dotenv").config();
const express = require('express');
const app = express()
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function createToken(user) {
    const token = jwt.sign(
        {
            email: user.email,
        },
        "secret",
        { expiresIn: "1y" }
    );
    return token;
}


function verifyToken(req, res, next) {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.send("You are not authorized");
    }
    const verify = jwt.verify(token, "secret");
    if (!verify?.email) {
        return res.send("You are not authorized");
    }
    req.user = verify.email;
    next();
}

const uri = process.env.DATABASE_URL;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        const userCollection = client.db("phone-store").collection("userCollection");
        const phoneCollection = client.db("phone-store").collection("phoneCollection");

        // user

        app.get("/user/get/:id", async (req, res) => {
            const id = req.params.id;
            const result = await userCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        app.get("/user/:email", async (req, res) => {
            const email = req.params.email;
            const result = await userCollection.findOne({ email });
            res.send(result);
        });

        app.post("/user", async (req, res) => {
            const user = req.body;
            const token = createToken(user);
            const isUserExist = await userCollection.findOne({ email: user?.email });
            if (isUserExist?._id) {
                return res.send({
                    status: "success",
                    message: "Login success",
                    token,
                });
            }
            await userCollection.insertOne(user);
            return res.send({ token });
        });

        app.patch("/user/:email", verifyToken, async (req, res) => {
            const email = req.params.email;
            const userData = req.body;
            const result = await userCollection.updateOne(
                { email },
                { $set: userData },
                { upsert: true }
            );
            res.send(result);
        });

        console.log("Database is connected");
    } finally {
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Phone store is listening on port ${port}`)
})