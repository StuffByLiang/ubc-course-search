import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {Helmet} from "react-helmet";
import * as serviceWorker from './serviceWorker';

import ReactGA from 'react-ga';

ReactGA.initialize('UA-177317940-1');
ReactGA.pageview(window.location.pathname + window.location.search);

ReactDOM.render(
  <React.StrictMode>
    <Helmet>
      <meta charSet="utf-8" />
      <title>UBC Course Search</title>
      <link rel="canonical" href="https://ubccourses.com" />
      <meta name="description" content="The best intelligent UBC Course searcher out there! Try searching 'Anime' or 'Greek Mythology'." />
    </Helmet>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
