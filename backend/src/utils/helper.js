exports.addMinutes = (minutes) => {
  const date = new Date();

  date.setMinutes(date.getMinutes() + minutes);

  return date;
};

exports.capitalize = (text = "") => {
  if (!text) return "";

  return text.charAt(0).toUpperCase() + text.slice(1);
};
