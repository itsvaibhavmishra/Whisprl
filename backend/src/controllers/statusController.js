import {
  discoverStatuses,
  listStatuses,
  markViewed,
  postStatus,
  reactToStatus,
  removeStatus,
  reportStatus,
  sealedForOf,
  setHiddenFrom,
} from "#src/services/statusService.js";

// the owner opens a viewer's reaction with that viewer's public key
const viewerOf = ({ _id, firstName, lastName, username, avatar, publicKeys }) => ({ _id, firstName, lastName, username, avatar, publicKeys });

export const getStatuses = async (req, res) => {
  res.status(200).json({ status: "success", statuses: await listStatuses(req.user) });
};

export const getDiscover = async (req, res) => {
  res.status(200).json({ status: "success", statuses: await discoverStatuses(req.user, req.query.owners) });
};

export const getSealedFor = async (req, res) => {
  res.status(200).json({ status: "success", sealedFor: await sealedForOf(req.user, req.body?.audience) });
};

export const createStatus = async (req, res) => {
  const { status, forOwner, forAudience } = await postStatus(req.user, req.body, req.file);
  const io = req.app.get("io");
  io.to(String(req.user._id)).emit("status_posted", forOwner);
  // an empty room list would broadcast to every socket
  if (status.audience.length) io.to(status.audience.map(String)).emit("status_posted", forAudience);
  res.status(201).json({ status: "success", posted: forOwner });
};

export const viewStatus = async (req, res) => {
  const viewed = await markViewed(req.user, req.params.status_id);
  if (viewed) {
    const view = { user: viewerOf(req.user), viewedAt: viewed.view.viewedAt };
    req.app.get("io").to(String(viewed.owner)).emit("status_viewed", { status_id: req.params.status_id, view });
  }
  res.status(200).json({ status: "success" });
};

export const reactStatus = async (req, res) => {
  const { owner, viewedAt, reaction } = await reactToStatus(req.user, req.params.status_id, req.body.cipher);
  const reacted = { user: viewerOf(req.user), viewedAt, reaction };
  req.app.get("io").to(String(owner)).emit("status_reacted", { status_id: req.params.status_id, view: reacted });
  res.status(200).json({ status: "success" });
};

export const reportStatusUpdate = async (req, res) => {
  await reportStatus(req.user, req.params.status_id, req.body);
  res.status(200).json({ status: "success", message: "Thanks, your report was sent" });
};

export const deleteStatus = async (req, res) => {
  const status = await removeStatus(req.user, req.params.status_id);
  req.app
    .get("io")
    .to([req.user._id, ...status.audience].map(String))
    .emit("status_removed", { _id: status._id });
  res.status(200).json({ status: "success" });
};

export const getHiddenFrom = (req, res) => {
  res.status(200).json({ status: "success", hiddenFrom: req.user.statusHiddenFrom });
};

export const updateHiddenFrom = async (req, res) => {
  res.status(200).json({ status: "success", hiddenFrom: await setHiddenFrom(req.user, req.body.hiddenFrom) });
};
