Imports starting with `https://` cannot be externalized

Reproduction

-   `npm install`
-   `npm run dev`
-   Will throw error `Cannot find module 'https://framer.com/m/Mega-Menu-2wT3.js' ` even thought there is a plugin to load it
-   Another plugin `exampleWorkingPlugin` does work because import source does not start with `https://`
