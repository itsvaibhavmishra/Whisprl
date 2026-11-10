import mongoose from "mongoose";

// a single document, read by every installed app
const updatePolicySchema = mongoose.Schema({
  // off until Play has the version the code recommends, since a release reaches apps before Play's review ends
  isShown: { type: Boolean, default: false },
  // an app Play did not install can only be sent to the listing, which most people cannot open while it is in testing
  isListed: { type: Boolean, default: false },
});

const UpdatePolicyModel = mongoose.model("UpdatePolicy", updatePolicySchema);

export default UpdatePolicyModel;
