import { strings } from './strings.cs';
import './style.css';

document.title = strings.appTitle;

const app = document.querySelector<HTMLElement>('#app');
if (app) {
  const heading = document.createElement('h1');
  heading.textContent = strings.appTitle;
  app.replaceChildren(heading);
}
