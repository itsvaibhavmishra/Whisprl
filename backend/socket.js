import { Server } from "socket.io"; // socket io

import { socketMiddleware } from "#src/middlewares/socketMiddleware.js";
import { emitFriendStatus } from "#src/controllers/friendsController.js";
import { joinConvo } from "#src/controllers/conversationController.js";
import { leaveGameOnDisconnect, socketActInGame, socketLookAtGame, socketReactInGame, socketUnwatchGame, socketWatchGame } from "#src/controllers/gameController.js";
import { socketMarkDelivered, socketMarkSeen, socketSendMessage } from "#src/controllers/messageController.js";
import { canMessageIn } from "#src/services/messageService.js";
import { setOnlineStatus } from "#src/services/userService.js";
import { withinBudget } from "#src/middlewares/socketRateLimit.js";
import { allowedOrigins } from "#src/utils/allowedOrigins.js";

export const initializeSocket = (server) => {
  // creating socket.io instence
  const io = new Server(server, {
    cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
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
    // ---------------Updating socket and user---------------
    const user = socket.user;
    const user_id = socket.user._id.toString();
    socket.data.userId = user_id;

    // join user with socket
    socket.join(user_id);
    const joinedConversations = joinConvo(socket, user_id);

    // ---------------Games---------------
    // watching in order, or a quick switch between chats could leave this socket counted in the wrong one
    let watching = Promise.resolve();
    const inWatchOrder = (work) => {
      watching = watching.then(work);
    };
    socket.on("game_watch", withinBudget(20, (conversation_id, acknowledge) => inWatchOrder(() => socketWatchGame(io, socket, conversation_id, acknowledge))));
    socket.on("game_unwatch", withinBudget(20, (acknowledge) => inWatchOrder(() => socketUnwatchGame(io, socket, acknowledge))));
    // in watch order too, so looking always applies to the game this socket is watching at that moment
    socket.on("game_look", withinBudget(30, (isLooking, acknowledge) => inWatchOrder(() => socketLookAtGame(io, socket, isLooking, acknowledge))));
    socket.on("game_act", withinBudget(30, (payload, acknowledge) => socketActInGame(io, socket, payload, acknowledge)));
    socket.on("game_react", withinBudget(20, (emoji, acknowledge) => socketReactInGame(socket, emoji, acknowledge)));

    // ---------------User Disconnects---------------
    // closing one tab must not show someone offline while another tab is still open
    socket.on("disconnect", async () => {
      inWatchOrder(() => leaveGameOnDisconnect(io, socket));
      if ((await io.in(user_id).fetchSockets()).length) return;

      setOnlineStatus(user_id, "offline").catch(() => {});
      emitFriendStatus(io, user, "offline").catch(() => {});
    });
    // ------------------------------------------------------

    // ---------------Send Message Hanling---------------
    // one send at a time per socket, or a quick second message could be saved before the first
    let sending = Promise.resolve();
    socket.on(
      "send_message",
      withinBudget(30, (payload, acknowledge) => {
        const reply = typeof acknowledge === "function" ? acknowledge : undefined;
        sending = sending.then(() => socketSendMessage(socket, payload ?? {}, reply));
      })
    );

    // only conversations this socket joined, which are the ones its user is in
    const inConversation = (handler) => async (conversation_id) => {
      await joinedConversations;
      if (socket.rooms.has(conversation_id)) handler(conversation_id);
    };

    // ---------------Typing Message Hanling---------------
    // ex-friends and blocked people stay in an old chat's room, so typing goes only where a message could
    const relayTyping = (event, typing) => async (conversation_id) => {
      if (await canMessageIn(conversation_id, user_id)) socket.to(conversation_id).emit(event, { typing, conversation_id, user_id });
    };

    socket.on("start_typing", withinBudget(60, inConversation(relayTyping("start_typing", true))));
    socket.on("stop_typing", withinBudget(60, inConversation(relayTyping("stop_typing", false))));

    // ---------------Read Receipts---------------
    const markDelivered = inConversation((conversation_id) => socketMarkDelivered(socket, [conversation_id]));
    const markSeen = inConversation((conversation_id) => socketMarkSeen(socket, conversation_id));
    socket.on("messages_delivered", withinBudget(60, markDelivered));
    socket.on("messages_seen", withinBudget(60, markSeen));

    // set user online, after every handler is registered so no early event is dropped
    await setOnlineStatus(user_id, "online").catch(() => socket.errorHandler("Could not set you online"));
    // gone while that write ran, and its disconnect handler has already marked them offline
    if (!socket.connected) return;

    emitFriendStatus(io, user, "online").catch(() => {});
    joinedConversations.then((conversation_ids) => conversation_ids && socketMarkDelivered(socket, conversation_ids));
  });

  return io;
};
