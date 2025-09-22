Deployment

Before deploying to GitHub Pages, update the `homepage` field in `package.json` to match your GitHub Pages URL. Example:

  "homepage": "https://yourusername.github.io/your-repo"

Then install the gh-pages package and run:

  npm install --save-dev gh-pages
  npm run deploy

This will build the app and publish the `build` folder to the `gh-pages` branch.
