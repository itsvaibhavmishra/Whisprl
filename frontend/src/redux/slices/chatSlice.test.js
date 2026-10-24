import { GetConversations, GetMessages } from "@/redux/slices/actions/chatActions";
import chatReducer, { openConversation, savedChatsDropped, savedChatsRestored } from "@/redux/slices/chatSlice";

const savedMessage = (id) => ({ _id: id, text: "saved", isSaved: true });
const fetchedMessage = (id) => ({ _id: id, text: "fresh" });

const restored = savedChatsRestored({
  conversations: [{ _id: "c1", latestMessage: { _id: "m1", text: "old preview" }, unread: 3 }],
  cache: { c1: { messages: [savedMessage("m1"), savedMessage("m2")], hasOlderMessages: true, hasNewerMessages: false } },
  albumReactions: {},
});

const listFetched = (conversations) => GetConversations.fulfilled({ conversations, arrivalsWhenAsked: 0 }, "list");
const pageFetched = (messages) => GetMessages.fulfilled({ messages, hasMore: false, unread: null }, "page", "c1");

test("a launch shows the chats saved on the phone", () => {
  const state = [restored].reduce(chatReducer, undefined);

  expect(state.hasLoadedConversations).toBe(true);
  expect(state.isListSaved).toBe(true);
  expect(state.conversations[0]._id).toBe("c1");
});

test("saved chats never replace a list the server has already sent", () => {
  const state = [listFetched([{ _id: "c9" }]), restored].reduce(chatReducer, undefined);

  expect(state.conversations.map((conversation) => conversation._id)).toEqual(["c9"]);
  expect(state.isListSaved).toBe(false);
});

test("the server's list takes over from the saved one, previews and unread counts included", () => {
  const fresh = { _id: "c1", latestMessage: { _id: "m5", text: "new preview" }, unread: 0 };
  const state = [restored, listFetched([fresh])].reduce(chatReducer, undefined);

  expect(state.conversations).toEqual([fresh]);
  expect(state.isListSaved).toBe(false);
});

test("a saved chat opens on its saved messages until the fresh page arrives", () => {
  const state = [restored, openConversation({ _id: "c1" })].reduce(chatReducer, undefined);

  expect(state.messages.map((message) => message._id)).toEqual(["m1", "m2"]);
});

test("the fresh page replaces saved messages, even ones newer than it that were deleted since", () => {
  const state = [restored, openConversation({ _id: "c1" }), pageFetched([fetchedMessage("m1")])].reduce(chatReducer, undefined);

  expect(state.messages).toEqual([fetchedMessage("m1")]);
});

test("a message that arrived while the fresh page was on its way stays", () => {
  const opened = [restored, openConversation({ _id: "c1" })].reduce(chatReducer, undefined);
  const withArrival = { ...opened, messages: [...opened.messages, fetchedMessage("m9")] };
  const state = chatReducer(withArrival, pageFetched([fetchedMessage("m1")]));

  expect(state.messages.map((message) => message._id)).toEqual(["m1", "m9"]);
});

test("saved chats this device can no longer read come off the screen", () => {
  const state = [restored, openConversation({ _id: "c1" }), savedChatsDropped()].reduce(chatReducer, undefined);

  expect(state.conversations).toEqual([]);
  expect(state.cache).toEqual({});
  expect(state.activeConversation).toBeNull();
  expect(state.hasLoadedConversations).toBe(false);
});

test("dropping saved chats leaves the server's list alone", () => {
  const state = [restored, listFetched([{ _id: "c1" }]), savedChatsDropped()].reduce(chatReducer, undefined);

  expect(state.conversations).toEqual([{ _id: "c1" }]);
});
