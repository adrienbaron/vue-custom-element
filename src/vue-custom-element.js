import registerCustomElement from './utils/registerCustomElement';
import createVueInstance from './utils/createVueInstance';
import { getProps, convertAttributeValue } from './utils/props';
import { camelize } from './utils/helpers';

function install(Vue) {
  Vue.customElement = function vueCustomElement(tag, componentConstructor, options = {}) {
    const props = getProps(componentConstructor);
    // register Custom Element
    return registerCustomElement(tag, {
      constructorCallback() {
        typeof options.constructorCallback === 'function' && options.constructorCallback.call(this);
      },

      connectedCallback() {
        if (!this.__detached__) {
          createVueInstance(this, Vue, componentConstructor, props, options);
        }

        typeof options.connectedCallback === 'function' && options.connectedCallback.call(this);
        this.__detached__ = false;
      },

      /**
       *  When using element in e.g. modal, it's detached and then attached back to document.
       *  It will be unfortunate if we will destroy Vue instance when it happens.
       *  That's why we detect if it's permament using setTimeout
       */
      disconnectedCallback() {
        this.__detached__ = true;
        typeof options.disconnectedCallback === 'function' && options.disconnectedCallback.call(this);

        setTimeout(() => {
          if (this.__detached__ && this.__vue_custom_element__) {
            this.__vue_custom_element__.$destroy(true);
          }
        }, options.destroyTimeout || 3000);
      },

      /**
       * When attribute changes we should update Vue instance
       * @param name
       * @param oldValue
       * @param value
       */
      attributeChangedCallback(name, oldValue, value) {
        if (this.__vue_custom_element__ && typeof value !== 'undefined') {
          const nameCamelCase = camelize(name);
          typeof options.attributeChangedCallback === 'function' && options.attributeChangedCallback.call(this, name, oldValue, value);
          this.__vue_custom_element__[nameCamelCase] = convertAttributeValue(value);
        }
      },

      observedAttributes: props.hyphenate,

      shadow: !!options.shadow && !!HTMLElement.prototype.attachShadow
    });
  };
}

export default install;

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(install);
  if (install.installed) {
    install.installed = false;
  }
}
