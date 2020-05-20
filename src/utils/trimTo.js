const trimTo = (value, size) => {
  if (!value)
    return value;

  const str = value.toString();

  if (str && str.length > size)
    return str.substr(0, str.length - 3).concat('...');

  return str;
};

export default trimTo;
