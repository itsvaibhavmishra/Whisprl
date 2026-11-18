import mongoose from "mongoose";

process.loadEnvFile();

// accounts made while sign up asked for a last name keep "onWhisprl" when Google gave none, which is no part of anyone's name
const LAST_NAME_FILLER = "onWhisprl";

const joined = (first, last) => ({
  $trim: { input: { $concat: [{ $ifNull: [first, ""] }, " ", { $cond: [{ $eq: [last, LAST_NAME_FILLER] }, "", { $ifNull: [last, ""] }] }] } },
});

await mongoose.connect(process.env.MONGODB_URI);
const users = mongoose.connection.db.collection("users");

// the old fields stay, so a server still on the code from before this keeps working until the release replaces it
const accounts = await users.updateMany({ firstName: { $exists: true }, name: { $exists: false } }, [{ $set: { name: joined("$firstName", "$lastName") } }]);
const hidden = await users.updateMany({ "hiddenProfile.firstName": { $exists: true }, "hiddenProfile.name": { $exists: false } }, [
  { $set: { "hiddenProfile.name": joined("$hiddenProfile.firstName", "$hiddenProfile.lastName") } },
]);

console.log(`named ${accounts.modifiedCount} accounts and ${hidden.modifiedCount} hidden profiles`);
await mongoose.disconnect();
