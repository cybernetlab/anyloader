require.config({
  baseUrl: '../',
  urlArgs: 'cb=' + Math.random(),
  paths: {
    spec: 'test/spec',
    jquery: 'lib/jquery/dist/jquery',
    underscore: 'lib/underscore/underscore',
    mocha: 'lib/mocha/mocha',
    expect: 'lib/expect/index'
  },
  urlArgs: 'bust=' + (new Date()).getTime()
});

require(['require', 'expect', 'mocha'], function(require) {
  mocha.setup('bdd');

  require([
    'spec/anyloader-spec'
  ], function() {
    mocha.run();
  });
});
