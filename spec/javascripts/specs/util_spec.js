(function(F) {
  describe('js/util.js', function() {
    it('checks if a url is a localhost address', function() {
      expect(F.Util.isLocalhost('http://localhost:8888/blah')).toBe(true);
      expect(F.Util.isLocalhost('http://localhost/')).toBe(true);
      expect(F.Util.isLocalhost('http://127.0.0.1/')).toBe(true);
      expect(F.Util.isLocalhost('http://openplans.org')).toBe(false);
    });
  });
}).call(this, Fitzgerald);
