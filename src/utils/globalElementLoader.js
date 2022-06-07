const globalElementLoader = name => ({
  name,
  element: customElements.get(name),
});

export default globalElementLoader;
