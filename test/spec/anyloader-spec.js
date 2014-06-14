(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['anyloader', 'jquery'], factory);
  } else if (typeof exports !== 'undefined') {
    // Node.js or CommonJS
    factory(require('anyloader'), require('jquery'));
  } else {
    // browser
    factory(root.LoaderFactory, root.$);
  }
}(this, function(LoaderFactory, $) {

  describe('anyloader', function() {
    it('avoid non-function callbacks', function() {
      expect(function() { LoaderFactory({ create: 0 }); }).to.throwError(/create callback should be a function/);
      expect(function() { LoaderFactory({ parse: 0 }); }).to.throwError(/parse callback should be a function/);
    });

    it('allows nested deferreds', function(done) {
      var nested = LoaderFactory();
      LoaderFactory({ create: function(x) {
        var d = $.Deferred();
        nested(x.f1).done(function(y) { d.resolve({ f1: y }); });
        return d;
      }})
        ('<i id="f1"><b id="n1">n1t</b></i>').done(function(obj) {
          expect(obj).to.eql({ f1: { n1: 'n1t' } });
          done();
        });
    });

    describe('loading from HTML string', function() {
      it('invokes parse callback if it given', function(done) {
        LoaderFactory({ parse: function(text) {
          expect(text).to.be('<i class="test"></i>');
          return { f1: 'f1t' };
        }})('<i class="test"></i>').done(function(obj) {
          expect(obj).to.eql({ f1: 'f1t' });
          done();
        });
      });

      it('parses tags with name, id and data-name attributes', function(done) {
        LoaderFactory()
          ('<i name="f1">f1t</i><i id="f2">f2t</i><i data-name="f3">f3t</i>')
          .done(function(obj) {
            expect(obj).to.eql({ f1: 'f1t', f2: 'f2t', f3: 'f3t' });
            done();
          });
      });

      it('parses tags without names as array', function(done) {
        LoaderFactory()('<i>f1t</i><i>f2t</i>').done(function(obj) {
          expect(obj).to.eql([ 'f1t', 'f2t' ]);
          done();
        });
      });

      it('drops tags without name if anyone with name is present', function(done) {
        LoaderFactory()('<i>f1t</i><i name="f2">f2t</i>').done(function(obj) {
          expect(obj).to.eql({ f2: 'f2t' });
          done();
        });
      });

      it('resolves with null for invalid HTML', function(done) {
        LoaderFactory()('<invalid HTML').done(function(obj) {
          expect(obj).to.eql(null);
          done();
        });
      });
    });

    describe('loading from JSON string', function() {
      it('parses JSON with line feeds', function(done) {
        LoaderFactory()('{\n\r"f1": "f1t",\n\t"f2": "f2t"}').done(function(obj) {
          expect(obj).to.eql({ f1: 'f1t', f2: 'f2t' });
          done();
        });
      });

      it('parses JSON arrays', function(done) {
        LoaderFactory()('["f1t", "f2t"]').done(function(obj) {
          expect(obj).to.eql([ 'f1t', 'f2t' ]);
          done();
        });
      });
    });

    describe('loading from URI string', function() {
      it('fails on wrong URI', function(done) {
        LoaderFactory()('wrong.uri').fail(function(msg) {
          expect(msg).to.eql('error while loading object from wrong.uri');
          done();
        });
      });

      it('fails on wrong content of downloaded file', function(done) {
        LoaderFactory()('data/wrong-data.txt').fail(function(msg) {
          expect(msg).to.eql('wrong object in data/wrong-data.txt');
          done();
        });
      });

      it('load valid HTML file', function(done) {
        LoaderFactory()('data/data.html').done(function(obj) {
          expect(obj).to.eql({ f1: 'f1t', f2: 'f2t' });
          done();
        });
      });

      it('load valid JSON file', function(done) {
        LoaderFactory()('data/data.json').done(function(obj) {
          expect(obj).to.eql({ f1: 'f1t', f2: 'f2t' });
          done();
        });
      });
    });

    describe('loading from jQuery', function() {
      it('loads from jQuery', function(done) {
        LoaderFactory()($('<i id="f1">f1t</i><i id="f2">f2t</i>')).done(function(obj) {
          expect(obj).to.eql({ f1: 'f1t', f2: 'f2t' });
          done();
        });
      });
    });

    describe('loading from plain object', function() {
      it('loads from jQuery', function(done) {
        LoaderFactory()({ f1: 'f1t', f2: 'f2t' }).done(function(obj) {
          expect(obj).to.eql({ f1: 'f1t', f2: 'f2t' });
          done();
        });
      });
    });
  });
}));
