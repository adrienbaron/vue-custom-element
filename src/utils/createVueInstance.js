import { getPropsData, reactiveProps } from './props';
import { getSlots } from './slots';
import { customEmit } from './customEvent';

/**
 * Create new Vue instance if it's not already created
 * (like when opening modal and moving element around DOM)
 * @param element
 * @param Vue
 * @param ComponentConstructor
 * @param props
 * @param options
 */
export default function createVueInstance(element, Vue, ComponentConstructor, props, options) {
  if (!element.__vue_custom_element__) {
    const propsData = getPropsData(element, ComponentConstructor.options, props);

    // Auto event handling based on $emit
    function beforeCreate() { // eslint-disable-line no-inner-declarations
      this.$emit = function emit(...args) {
        customEmit(element, ...args);
        this.__proto__ && this.__proto__.$emit.call(this, ...args); // eslint-disable-line no-proto
      };
    }

    const ExtendedComponentConstructor = ComponentConstructor.extend({ beforeCreate });

    const elementOriginalChildren = element.cloneNode(true).childNodes; // clone hack due to IE compatibility
    const rootElement = {
      propsData,
      props: props.camelCase,
      computed: {
        reactiveProps() {
          const reactivePropsList = {};
          props.camelCase.forEach((prop) => {
            reactivePropsList[prop] = this[prop];
          });

          return reactivePropsList;
        }
      },
      /* eslint-disable */
      render(createElement) {
        const data = {
          props: this.reactiveProps
        };

        return createElement(
          ExtendedComponentConstructor,
          data,
          getSlots(elementOriginalChildren, createElement)
        );
      }
      /* eslint-enable */
    };

    const elementInnerHtml = '<div></div>';
    if (options.shadow && element.shadowRoot) {
      element.shadowRoot.innerHTML = elementInnerHtml;
      rootElement.el = element.shadowRoot.children[0];
    } else {
      element.innerHTML = elementInnerHtml;
      rootElement.el = element.children[0];
    }

    reactiveProps(element, props);

    // Define the Vue constructor to manage the element
    element.__vue_custom_element__ = new Vue(rootElement);
    if (options.shadow && options.shadowCss && element.shadowRoot) {
      const style = document.createElement('style');
      style.type = 'text/css';
      style.appendChild(document.createTextNode(options.shadowCss));

      element.shadowRoot.appendChild(style);
    }
    element.removeAttribute('vce-cloak');
    element.setAttribute('vce-ready', '');
    customEmit(element, 'vce-ready');
  }
}
