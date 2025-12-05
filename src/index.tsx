import React from 'react';

import ReactDOM from 'react-dom/client';

import App from './App';





const REFRESH_KEY = Date.now();



const rootElement = document.getElementById('root');

if (rootElement) {

ReactDOM.createRoot(rootElement).render(

<React.StrictMode>

<App key={REFRESH_KEY} />

</React.StrictMode>

);

}
