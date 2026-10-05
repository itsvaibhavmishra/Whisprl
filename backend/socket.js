import { Server } from "socket.io"; // socket io

import { socketMiddleware } from "./src/middlewares/socketMiddleware.js";
import { emitFriendStatus } from "./src/controllers/friendsController.js";
import { joinConvo } from "./src/controllers/conversationController.js";
import { socketMarkDelivered, socketMarkSeen, socketSendMessage } from "./src/controllers/messageController.js";
import { setOnlineStatus } from "./src/services/userService.js";

export const initializeSocket = (server) => {
  // creating socket.io instence
  const io = new Server(server, {
    cors: { origin: process.env.FRONT_URL, methods: ["GET", "POST"] },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // socket protect middleware
  io.use(socketMiddleware);

  // socket error middleware
  io.use((socket, next) => {
    socket.errorHandler = (error) => {
      // Emit an error event to the client
      socket.emit("error", { status: "error", message: error });
    };

    next();
  });

  // listen to socket connection
  io.on("connection", async (socket) => {
    const socket_id = socket.id;

    // ---------------Updating socket and user---------------
    const user = socket.user;
    const user_id = socket.user._id.toString();

    // join user with socket
    socket.join(user_id);
    const joinedConversations = joinConvo(socket, user_id);

    // ---------------User Disconnects---------------
    socket.on("disconnect", () => {
      setOnlineStatus(user_id, "offline").catch(() => {});

      emitFriendStatus(io, socket, user, "offline");
    });
    // ------------------------------------------------------

    // ---------------Send Message Hanling---------------
    // one send at a time per socket, or a quick second message could be saved before the first
    let sending = Promise.resolve();
    socket.on("send_message", (payload, acknowledge) => {
      const reply = typeof acknowledge === "function" ? acknowledge : undefined;
      sending = sending.then(() => socketSendMessage(io, socket, payload ?? {}, reply));
    });

    // only conversations this socket joined, which are the ones its user is in
    const inConversation = (handler) => async (conversation_id) => {
      await joinedConversations;
      if (socket.rooms.has(conversation_id)) handler(conversation_id);
    };

    // ---------------Typing Message Hanling---------------
    const relayTyping = (event, typing) => (conversation_id) =>
      socket.to(conversation_id).emit(event, { typing, conversation_id });

    socket.on("start_typing", inConversation(relayTyping("start_typing", true)));
    socket.on("stop_typing", inConversation(relayTyping("stop_typing", false)));

    // ---------------Read Receipts---------------
    socket.on("messages_delivered", inConversation((conversation_id) => socketMarkDelivered(socket, [conversation_id])));
    socket.on("messages_seen", inConversation((conversation_id) => socketMarkSeen(socket, conversation_id)));

    // set user online, after every handler is registered so no early event is dropped
    await setOnlineStatus(user_id, "online").catch(() => socket.errorHandler("Could not set you online"));

    emitFriendStatus(io, socket, user, "online");
    joinedConversations.then((conversation_ids) => conversation_ids && socketMarkDelivered(socket, conversation_ids));
  });

  return io;
};
