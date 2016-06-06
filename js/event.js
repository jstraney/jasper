(function (jas) {
  var publications = {};

  function publication () {
    var subscribers = {};
    function subscriber (callback) {
      return {
        callback: callback,
      } 
    }
    
    return {
      publish: function (event) {
        for (var i in subscribers) {
          subscribers[i].callback(event);
        }
      },
      addSubscriber: function (subId, callback) {
        subscribers[subId] = subscriber(callback);
      },
      removeSubscriber: function (subId) {
        delete subscribers[subId];
      }
    }
  }
  
  jas.Event = {
    addPublication: function (name) {
      console.log(name);
      publications[name] = publication();
    },
    remPublication: function (name) { // careful! destroys subscribers too
      delete publications[name];
    },
    subscribe: function (pubId, subId, callback) {
      publications[pubId].addSubscriber(subId, callback);
    },
    unsubscribe: function (pubId, subId) {
      publications[pubId].removeSubscriber(subId);
    },
    publish: function (pubId, event) {
      publications[pubId].publish(event);
    }
  };
  
})(jas);