import React from "react";
import TimeAgo from "react-timeago";

import { formatClock } from "@/utils/formatMessageTime";

const formatTime = (time, use24Hour) => {
  // Custom formatter for TimeAgo
  const customFormatter = (value, unit, suffix) => {
    const currentDate = new Date();
    const messageDate = new Date(time);

    // Format time if it's today
    if (
      currentDate.getDate() === messageDate.getDate() &&
      currentDate.getMonth() === messageDate.getMonth() &&
      currentDate.getFullYear() === messageDate.getFullYear()
    ) {
      return formatClock(messageDate, use24Hour);
    }

    // Format as yesterday if it's yesterday
    const yesterday = new Date();
    yesterday.setDate(currentDate.getDate() - 1);
    if (
      yesterday.getDate() === messageDate.getDate() &&
      yesterday.getMonth() === messageDate.getMonth() &&
      yesterday.getFullYear() === messageDate.getFullYear()
    ) {
      return "Yesterday";
    }

    // Format as a date
    const options = { day: "numeric", month: "numeric", year: "numeric" };
    return messageDate.toLocaleDateString("en-US", options);
  };

  return <TimeAgo date={time} formatter={customFormatter} title="" />;
};

export default formatTime;
