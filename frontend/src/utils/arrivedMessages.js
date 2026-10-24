import { registerPlugin } from "@capacitor/core";

const ArrivedMessages = registerPlugin("ArrivedMessages");

export const takeArrivedMessages = async (userId) => (await ArrivedMessages.take({ userId })).messages;
