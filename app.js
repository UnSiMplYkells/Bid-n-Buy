require("dotenv").config();
require("express-async-errors");

const connectDB = require("./db/connect");
require("./services/endAuction");

const express = require("express");
const socketIO = require("socket.io");
const app = express();

const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

const authenticateUser = require("./middleware/authentication");

const authRouter = require("./routes/auth");
const userRouter = require("./routes/users");
const auctionRouter = require("./routes/auction");
const bidRouter = require("./routes/bids");

// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

// general limiter
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());

// app.use(
//   cors({
//     origin: "https://yourfrontend.com",
//     methods: ["GET", "POST", "PATCH", "DELETE"],
//     credentials: true, // if using cookies
//   }),
// );

//  auth limiter
const authLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many attempts, please try again later",
});

// bid limiter
const bidLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
});

// routes
app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/user", authenticateUser, userRouter);
app.use("/api/v1/auction", authenticateUser, auctionRouter);
app.use("/api/v1/bid", bidLimiter, authenticateUser, bidRouter);

app.get("/", (req, res) => {
  res.send("Welcome to the Auction API");
});

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 4000;

async function start() {
  try {
    await connectDB(process.env.MONGO_URI);

    const server = app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });

    const io = socketIO(server, {
      cors: {
        origin: "*", // Replace with your frontend URL in production, e.g. "https://yourfrontend.com"
        methods: ["GET", "POST"],
        credentials: true,
      },
    });
    app.set("io", io);

    io.on("connection", (socket) => {
      console.log("New client connected to socketIO");

      // join a specific auction room
      socket.on("joinAuction", (auctionId) => {
        socket.join(`auction-${auctionId}`);
      });

      socket.on("leaveAuction", (auctionId) => {
        socket.leave(`auction-${auctionId}`);
      });

      // join personal user room
      socket.on("joinUserRoom", (userId) => {
        socket.join(`user-${userId}`);
      });

      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  } catch (error) {
    console.log(error);
  }
}

start();
