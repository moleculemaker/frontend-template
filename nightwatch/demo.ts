import {NightwatchAPI, NightwatchTests} from 'nightwatch';

const home: NightwatchTests = {
  'MMLI Homepage': () => {
    browser.url('http://localhost:4200').assert.visible('body');
  },
};

export default home;
