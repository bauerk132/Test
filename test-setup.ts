import { GlobalWindow } from 'happy-dom';
const window = new GlobalWindow();
// happy-dom's types don't fully match lib.dom's, but the runtime objects are compatible.
global.window = window as unknown as typeof global.window;
global.document = window.document as unknown as Document;
global.navigator = window.navigator as unknown as Navigator;
global.HTMLElement = window.HTMLElement as unknown as typeof HTMLElement;
