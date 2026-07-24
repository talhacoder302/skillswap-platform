require("./app-global");
require("dotenv").config();
const http = require("http");
const app = require(`${__config}/express`);
const connectDB = require(`${__config}/dbConn`);
const PORT = process.env.PORT || 5000;
const { Server } = require("socket.io");

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    const { initializeSocket } = require(`${__socket}`);
    initializeSocket(io);

    server.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`🚀 SkillSwap Backend Started`);
      console.log(`🌐 Server Running On Port : ${PORT}`);
      console.log(`🌍 Environment : ${process.env.NODE_ENV}`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error("Server Startup Failed");
    console.error(error);

    process.exit(1);
  }
};

startServer();
