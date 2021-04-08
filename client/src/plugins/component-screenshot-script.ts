// This module is injected into the page instance to evaluate components
export default `
/**
 * Proof of concept to find weighted components.
 * @returns string[];
 */
window.$plugin = () => {
  // Generates an xpath string from a supplied element.
  var xpath = el => {
    if (!el || el.nodeType != 1) {
      return '';
    }
    if (el.id) {
      return "//*[@id='" + el.id + "']";
    }
    var sames = [].filter.call(
      el.parentNode.children,
      x => x.tagName == el.tagName,
    );
    return (
      xpath(el.parentNode) +
      '/' +
      el.tagName.toLowerCase() +
      (sames.length > 1 ? '[' + ([].indexOf.call(sames, el) + 1) + ']' : '')
    );
  };

  // Generates a unique key that includes the element tag and class
  var getElementKey = element => element.tagName + '::' + xpath(element);

  // Get all eligible elements.
  var elements = Array.from(
    document.body.firstElementChild.querySelectorAll('*'),
  );

  // Sort by dimensions (largest first)
  elements = elements.sort((a, b) => {
    return a.clientWidth + a.clientHeight < b.clientWidth + b.clientHeight
      ? 1
      : -1;
  });

  // Remove any elements that have dimensions less than the full page.
  // This is to prevent duplicate full-page screenshots.
  elements = elements.filter(
    el =>
      el.clientWidth > 0 &&
      el.clientWidth < document.body.clientWidth &&
      el.clientHeight < document.body.clientHeight,
  );

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

  // To test "highestWeightedElements" array.
  // return highestWeightedElements.slice(0, 4).map(res => res.cls);

  // Only want items that repeat more than once.
  // Do we still need this?
  highestWeightedElements = highestWeightedElements.filter(o => o.count > 1);

  // Only want elements with at least N px dimensions.
  // var dimensionThreshold = 10;
  highestWeightedElements = highestWeightedElements.filter(obj => {
    var xp = obj.cls.split('::')[1];
    var el = elements.find(el => xpath(el) === xp);
    return (
      el.clientWidth < dimensionThreshold &&
      el.clientHeight < dimensionThreshold
    );
  });

  // Fallback to form if weighted components not found.
  if (!highestWeightedElements.length) {
    var form = document.querySelectorAll('form');
    if (form.length) {
      var elements = Array.from(form);
      var keys = elements.map(el => {
        // Grab form's parent if width is viable.
        // Without this check puppeteer will throw a fatal error.
        const formParent =
          el?.parentElement.clientWidth > 0 ? el.parentElement : el;
        return getElementKey(formParent || el);
      });
      return keys;
    } else {
      // No important components or forms found =(
      return [];
    }
  }

  // Results are flat array of class
  var pluginResults = highestWeightedElements.slice(0, 4).map(res => res.cls);

  return pluginResults;
};
`;
