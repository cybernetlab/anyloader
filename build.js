({
  paths: {
    jquery     : 'lib/jquery/dist/jquery.min',
    underscore : 'lib/underscore/underscore'
  },

  removeCombined: true,
  optimize: 'uglify2',

  dir: 'dist',
  modules: [
    {
      name: 'anyloader',
      out: 'anyloader.min.js',
      exclude: ['jquery', 'underscore']
    }
  ]
})
