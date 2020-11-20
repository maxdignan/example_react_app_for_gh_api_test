module.exports = {
  login: {
    url: 'login',
    user: 'zak+provider@horizontwolabs.com',
    password: 'abcd1234',
  },
  routes: {
    '*': {
      auth: true,
    },
    ':id': {
      id: 2,
    },
    'jobs/:id': {
      id: 22,
    },
    'jobs/:id/overview': {
      id: 22,
    },
    'p/:loc': {
      loc: 37,
    },
    'p/:msa/:org/:loc': {
      loc: 37,
    },
    parts: {
      id: 10,
      auth: true,
    },
    settings: {
      delay: 1,
    },
    feedback: {
      enabled: false,
    },
    status: {
      enabled: false,
    },
  },
};
