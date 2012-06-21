var Fitzgerald = Fitzgerald || {};

(function(F) {

  F.Util = {
    isLocalhost: function(url){
      url = url || location.hostname;
      return (url.indexOf('localhost') > 0 || url.indexOf('127.0.0.1') > 0);
    }
  };
})(Fitzgerald);
