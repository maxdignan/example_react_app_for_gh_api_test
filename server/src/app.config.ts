const domain = '??';

const config = {
  name: '??',
  formattedName: '??',
  domain,
  apiUrl: `a.${domain}`,
  secret: process.env.APP_SECRET,
  emails: {
    help: `support@${domain}`,
    general: `hi@${domain}`,
    noreply: `noreply@${domain}`,
  },
  mongo: {
    url: process.env.DB_URL,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    auth: process.env.REDIS_AUTH,
  },
  mailgun: {
    key: process.env.MAILGUN_KEY,
  },
  stripe: {
    publish: process.env.STRIPE_PUBLISH,
    secret: process.env.STRIPE_SECRET,
    signatures: 'live',
    plans: [
      process.env.PRODUCT_BASIC_ID,
      process.env.PRODUCT_PREMIUM_ID,
      process.env.PRODUCT_PRO_ID,
    ],
  },
};

// console.log('dumping application config...');
// console.log(require('util').inspect(config));

export default config;
