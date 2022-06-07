const buildElementDefinitions = (elements, constructor) => elements.reduce(
  (aggregate, element) => {
    if (element.defineId) {
      // eslint-disable-next-line no-param-reassign
      aggregate[element.defineId] = element;
    } else {
      // eslint-disable-next-line no-param-reassign
      aggregate[element.name] = element.element;
    }
    return aggregate;
  }, {},
);

export default buildElementDefinitions;
