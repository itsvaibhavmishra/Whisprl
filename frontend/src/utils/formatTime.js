import React from "react";
import TimeAgo from "react-timeago";

export const getSimpleData = (inputDate) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Parse the input date string
  const date = new Date(inputDate);

  // Extract day, month, and year components
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  // Function to get the ordinal suffix for the day
  function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  // Format the date
  const formattedDate =
    day + getOrdinalSuffix(day) + " " + months[monthIndex] + ", " + year;
  return formattedDate;
};

const formatTime = (time) => {
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
      return messageDate.toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
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
