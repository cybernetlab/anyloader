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
    it('allows nested loaders for objects', function(done) {
      var nested = LoaderFactory();
      var loader = LoaderFactory({ 'compose:object[f1]': nested });
      loader('<i id="f1"><b id="n1">n1t</b></i>').done(function(obj) {
        expect(obj).to.eql({ f1: { n1: 'n1t' } });
        done();
      });
    });

    it('allows objects keys callback', function(done) {
      var loader = LoaderFactory({ 'compose:object[]': function(k, v) {
        return [k + '_', v + '!'];
      } });
      loader('<i id="f1">f1t</i><i id="f2">f2t</i>').done(function(obj) {
        expect(obj).to.eql({ f1_: 'f1t!', f2_: 'f2t!' });
        done();
      });
    });

    it('allows nested loaders for arrays', function(done) {
      var nested = LoaderFactory();
      var loader = LoaderFactory({ 'compose:array[]': nested });
      loader('<i><b id="n1">n1t</b></i><i><b id="n2">n2t</b></i>').done(function(obj) {
        expect(obj).to.eql([ { n1: 'n1t' }, { n2: 'n2t'} ]);
        done();
      });
    });

    it('invokes parse callback if it given', function(done) {
      LoaderFactory({ parse: function(text) {
        expect(text).to.be('<i class="test"></i>');
        return { f1: 'f1t' };
      }})('<i class="test"></i>').done(function(obj) {
        expect(obj).to.eql({ f1: 'f1t' });
        done();
      });
    });

    describe('loading from HTML string', function() {
      it('invokes parse:html callback if it given', function(done) {
        var loader = LoaderFactory({ 'parse:html': function(text) {
          expect(text).to.be('<i class="test"></i>');
          return this.defaults['parse:html']('<i name="f1">f1t</i>');
        }});
        loader('<i class="test"></i>').done(function(obj) {
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
      it('invokes parse:json callback if it given', function(done) {
        var loader = LoaderFactory({ 'parse:json': function(text) {
          expect(text).to.be('{"f": "ft"}');
          return loader.defaults['parse:json']('{"f1": "f1t"}');
        }});
        loader('{"f": "ft"}').done(function(obj) {
          expect(obj).to.eql({ f1: 'f1t' });
          done();
        });
      });

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

    describe('loading string itself', function() {
      it('invokes parse:string callback if it given', function(done) {
        var loader = LoaderFactory({ 'parse:string': function(text) {
          expect(text).to.be('test');
          return { f1: 'f1t' };
        }});
        loader('test').done(function(obj) {
          expect(obj).to.eql({ f1: 'f1t' });
          done();
        });
      });

      it('parses string as is', function(done) {
        LoaderFactory()('string').done(function(obj) {
          expect(obj).to.eql('string');
          done();
        });
      });
    });

    describe('loading from URI string', function() {
      it('invokes parse:uri callback if it given', function(done) {
        var loader = LoaderFactory({ 'parse:uri': function(text) {
          expect(text).to.be('test');
          return { f1: 'f1t' };
        }});
        loader('test').done(function(obj) {
          expect(obj).to.eql({ f1: 'f1t' });
          done();
        });
      });

      it('resolves as string on wrong URI', function(done) {
        LoaderFactory()('url(wrong.uri)').done(function(obj) {
          expect(obj).to.eql('url(wrong.uri)');
          done();
        });
      });

      it('resolves as content on wrong content of downloaded file', function(done) {
        LoaderFactory()('url("data/wrong-data.txt")').done(function(obj) {
          expect(obj).to.eql('wrong data\n');
          done();
        });
      });

      it('load valid HTML file', function(done) {
        LoaderFactory()('url( "data/data.html" )').done(function(obj) {
          expect(obj).to.eql({ f1: 'f1t', f2: 'f2t' });
          done();
        });
      });

      it('load valid JSON file', function(done) {
        LoaderFactory()("url('data/data.json')").done(function(obj) {
          expect(obj).to.eql({ f1: 'f1t', f2: 'f2t' });
          done();
        });
      });
    });

    describe('loading from jQuery', function() {
      var jquery = $('<i id="f1">f1t</i><i id="f2">f2t</i>');

      it('invokes parse:jquery callback if it given', function(done) {
        var loader = LoaderFactory({ 'parse:jquery': function(obj) {
          expect(obj).to.eql(jquery);
          return { f1: 'f1t' };
        }});
        loader(jquery).done(function(obj) {
          expect(obj).to.eql({ f1: 'f1t' });
          done();
        });
      });

      it('loads from jQuery', function(done) {
        LoaderFactory()(jquery).done(function(obj) {
          expect(obj).to.eql({ f1: 'f1t', f2: 'f2t' });
          done();
        });
      });
    });

    describe('loading from plain object', function() {
      it('loads from plain object', function(done) {
        LoaderFactory()({ f1: 'f1t', f2: 'f2t' }).done(function(obj) {
          expect(obj).to.eql({ f1: 'f1t', f2: 'f2t' });
          done();
        });
      });
    });
  });
}));
