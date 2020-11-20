const fonts = ['Encode Sans Semi Expanded', 'sans-serif'];

module.exports = {
  theme: {
    extend: {
      screens: {
        portrait: { raw: '(orientation: portrait)' },
      },
      width: {
        200: '200px',
        250: '250px',
        350: '350px',
        400: '400px',
        500: '500px',
        600: '600px',
        800: '800px',
        1200: '1200px',
      },
      margin: {
        '-50': '-50%',
        '-240': '-240px',
        '-300': '-300px',
      },
      height: {
        'form-control': '60px',
      },
    },
    inset: {
      0: 0,
      1: '30px',
      2: '63px',
      '1/2': '50%',
    },
    colors: {
      '-': 'transparent',
      white: '#fff',
      black: '#212225',
      primary: '#386edc',
      'primary-light': '#5c7499',
      yellow: '#ffb700',
      'yellow-light': '#FFC739',
      'gray-100': '#f9fafc',
      'gray-200': '#e7eaf0',
      'gray-300': '#d7dae0',
      'gray-500': '#757575',
      green: '#5ea54a',
      blue: '#386edc',
      'blue-gray': '#5c7499',
      red: '#ef2001',
    },
    fontFamily: {
      body: fonts,
      display: fonts,
    },
    borderWidth: {
      default: '1px',
      '0': 'none',
      '1': '1px',
      '2': '2px',
      '3': '3px',
      '4': '4px',
    },
    // Use the default mobile-first config.
    // screens: {
    //   sm: { max: '640px' },
    //   md: { min: '768px' },
    //   lg: { min: '1024px' },
    //   xl: { min: '1280px' },
    //   xxl: { min: '1580px' },
    // },
  },
  variants: {
    opacity: ['group-hover', 'hover'],
    translate: ['group-hover', 'hover'],
    margin: ['responsive', 'group-hover', 'hover'],
  },
};
