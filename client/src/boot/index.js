/* global window */
import GridBlock from 'components/GridBlock';

const getInjector = () => {
  const injector = window.Injector;
  if (injector && injector.default) {
    return injector.default;
  }
  return injector;
};

export function initGridInterface() {
  const Injector = getInjector();
  
  if (!Injector || typeof Injector.transform !== 'function') {
    setTimeout(initGridInterface, 100);
    return;
  }

  // Register the Element enhancement
  Injector.transform('grid-block-enhancement', (updater) => {
    updater.component('Element', GridBlock);
  });
  
  console.log('[Grid] Interface initialized');
}
