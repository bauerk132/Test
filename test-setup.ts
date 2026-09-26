import { GlobalWindow } from 'happy-dom';
const window = new GlobalWindow();
global.window = window;
global.document = window.document;
global.navigator = window.navigator;
global.HTMLElement = window.HTMLElement;
