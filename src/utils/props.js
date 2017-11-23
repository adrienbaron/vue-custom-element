import { camelize, hyphenate } from './helpers';

/**
 * Number and Boolean props are treated as strings
 * We should convert it so props will behave as intended
 * @param value
 * @returns {*}
 */
export function convertAttributeValue(value) {
  let propsValue = value;
  const isBoolean = ['true', 'false'].indexOf(value) > -1;
  const valueParsed = parseFloat(propsValue, 10);
  const isNumber = !isNaN(valueParsed) && isFinite(propsValue);

  if (isBoolean) {
    propsValue = propsValue === 'true';
  } else if (isNumber) {
    propsValue = valueParsed;
  }

  return propsValue;
}

function extractProps(collection, props) {
  if (collection && collection.length) {
    collection.forEach((prop) => {
      const camelCaseProp = camelize(prop);
      props.camelCase.indexOf(camelCaseProp) === -1 && props.camelCase.push(camelCaseProp);
    });
  } else if (collection && typeof collection === 'object') {
    for (const prop in collection) { // eslint-disable-line no-restricted-syntax, guard-for-in
      const camelCaseProp = camelize(prop);
      props.camelCase.indexOf(camelCaseProp) === -1 && props.camelCase.push(camelCaseProp);
    }
  }
}

function getPropsRecursive(ComponentConstructor, props) {
  const options = ComponentConstructor.options;
  if (!options) {
    return;
  }

  if (options.mixins) {
    options.mixins.forEach((mixin) => {
      extractProps(mixin.props, props);
    });
  }

  extractProps(options.props, props);

  if (ComponentConstructor.constructor) {
    getPropsRecursive(ComponentConstructor.constructor, props);
  }
}

/**
 * Extract props from component definition, no matter if it's array or object
 * @param ComponentConstructor
 */
export function getProps(ComponentConstructor) {
  const props = { camelCase: [], hyphenate: [] };

  getPropsRecursive(ComponentConstructor, props);

  props.camelCase.forEach((prop) => {
    props.hyphenate.push(hyphenate(prop));
  });

  return props;
}

/**
 * If we get DOM node of element we could use it like this:
 * document.querySelector('widget-vue1').prop1 <-- get prop
 * document.querySelector('widget-vue1').prop1 = 'new Value' <-- set prop
 * @param element
 * @param props
 */
export function reactiveProps(element, props) {
  // Handle param attributes
  props.camelCase.forEach((name, index) => {
    Object.defineProperty(element, name, {
      get() {
        return this.__vue_custom_element__[name];
      },
      set(value) {
        if ((typeof value === 'object' || typeof value === 'function') && this.__vue_custom_element__) {
          const propName = props.camelCase[index];
          this.__vue_custom_element__[propName] = value;
        } else {
          this.setAttribute(props.hyphenate[index], convertAttributeValue(value));
        }
      }
    });
  });
}

/**
 * In root Vue instance we should initialize props as 'propsData'.
 * @param element
 * @param componentDefinition
 * @param props
 */
export function getPropsData(element, componentDefinition, props) {
  const propsData = componentDefinition.propsData || {};

  props.hyphenate.forEach((name, index) => {
    const elementAttribute = element.attributes[name];
    const propCamelCase = props.camelCase[index];

    if (typeof elementAttribute === 'object' && !(elementAttribute instanceof Attr)) {
      propsData[propCamelCase] = elementAttribute;
    } else if (elementAttribute instanceof Attr && elementAttribute.value) {
      propsData[propCamelCase] = convertAttributeValue(elementAttribute.value);
    }
  });

  return propsData;
}
