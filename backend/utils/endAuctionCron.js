const cron = require("node-cron");
const Auction = require("../models/Auction");

async function task() {
  try {
    const result = await Auction.updateMany(
      { endTime: { $lte: new Date() }, status: "active" },
      { $set: { status: "closed" } },
    );
    
    console.log(`Closed ${result.modifiedCount} auctions at ${new Date()}`);
  } catch (error) {
    console.error("Cron job error:", error);
  }
}

cron.schedule("* * * * *", task)