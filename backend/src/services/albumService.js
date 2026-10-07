import { AlbumModel, MessageModel } from "#src/models/index.js";

// only groups with reactions are sent, so a group missing from the list has none
export const albumsFor = async (conversation_id, messages) => {
  const batchIds = [...new Set(messages.map((message) => message.batchId).filter(Boolean))];
  if (!batchIds.length) return [];
  return AlbumModel.find({ conversation: conversation_id, batchId: { $in: batchIds }, "reactions.0": { $exists: true } })
    .select("-_id sender batchId reactions")
    .lean();
};

// a group's reactions go once none of its photos is left standing
export const dropEmptyAlbums = async (messages) => {
  const byConversation = Object.groupBy(messages.filter((message) => message.batchId), (message) => String(message.conversation));
  await Promise.all(
    Object.entries(byConversation).map(async ([conversation, sent]) => {
      const batchIds = sent.map((message) => message.batchId);
      const standing = await MessageModel.distinct("batchId", { conversation, batchId: { $in: batchIds }, deletedAt: null });
      await AlbumModel.deleteMany({ conversation, batchId: { $in: batchIds.filter((batchId) => !standing.includes(batchId)) } });
    })
  );
};
