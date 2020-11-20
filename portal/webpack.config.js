const purgecss = require('@fullhuman/postcss-purgecss')({
  // Specify the paths to all of the template files in your project
  content: ['./src/**/*.html', './src/**/*.component.ts'],
  // Include any special characters you're using in this regular expression
  // defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
  defaultExtractor: content => {
    // content.match(/[A-Za-z0-9-_:\/]+/g)  || [];
    // Capture as liberally as possible, including things like `h-(screen-1.5)`
    const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];

    // Capture classes within other delimiters like .block(class="w-1/2") in Pug
    const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];

    return broadMatches.concat(innerMatches);
  },
  whitelist: ['is-active'],
});

module.exports = (config, options) => {
  console.log(`Custom webpack config using '${config.mode}' mode`);
  config.module.rules.push({
    test: /\.scss$/,
    use: [
      {
        loader: 'postcss-loader',
        options: {
          ident: 'postcss',
          syntax: 'postcss-scss',
          plugins: [
            require('postcss-import'),
            require('tailwindcss')('./tailwind.config.js'),
            ...(config.mode === 'production'
              ? [require('autoprefixer'), purgecss]
              : []),
          ],
        },
      },
    ],
  });
  return config;
};
