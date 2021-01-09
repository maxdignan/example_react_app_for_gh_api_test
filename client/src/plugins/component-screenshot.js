/**
 * Proof of concept to find weighted components.
 */
window.$plugin = () => {
  // Generates a unique key that includes the element tag and class
  var getElementKey = element => `${element.tagName}::${element.className}`;

  // Get all elements
  var elements = Array.from(document.body.querySelectorAll('[class]'));

  // Sort by dimensions (largest first)
  elements = elements.sort((a, b) => {
    return a.clientWidth + a.clientHeight < b.clientWidth + b.clientHeight
      ? 1
      : -1;
  });

  // Only want the largest
  elements = elements.slice(0, 20);

  // Count how many times the class name appears
  var counts = elements.reduce(
    (acc, element) => ({
      ...acc,
      [getElementKey(element)]: (acc[getElementKey(element)] || 0) + 1,
    }),
    {},
  );

  // Create array of weights from element count
  var highestWeightedElements = Object.keys(counts)
    .map(k => ({ count: counts[k], cls: k }))
    .sort((a, b) => (a.count > b.count ? -1 : 1));

  // Only want items that repeat more than once
  highestWeightedElements = highestWeightedElements.filter(o => o.count > 1);

  // console.log(highestWeightedElements);

  // Be sure you stringify any result or it will be empty!
  var pluginResults = highestWeightedElements.slice(0, 1).map(res => {
    const cls = res.cls.split('::')[1];
    const element = document.body.querySelector(`[class="${cls}"]`);
    const rect = element.getBoundingClientRect();
    return JSON.stringify({
      ...res,
      rect,
    });
  });

  // if (highestWeightedElements.length) {
  //   // Take shot of just one of these? All of them, or the parent element?
  //   pluginResults = Array.from(
  //     document.querySelectorAll(`[class="${highestWeightedElements[0].cls}"]`)
  //   );
  //   // console.log(pluginResults);
  // }

  return pluginResults;
};
