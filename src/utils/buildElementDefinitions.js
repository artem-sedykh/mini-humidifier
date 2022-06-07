const buildElementDefinitions = elements => elements.reduce(
  (aggregate, element) => {
    if (element.defineId) {
      // eslint-disable-next-line no-param-reassign
      aggregate[element.defineId] = element;
    } else if (typeof element === 'string') {
      // eslint-disable-next-line no-param-reassign
      aggregate[element] = customElements.get(element);
    }
    return aggregate;
  }, {},
);

export default buildElementDefinitions;
