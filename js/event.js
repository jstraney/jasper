(function (jas) {
  var publications = {};
  var subscriberAutoId = 0;
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
        subscribers[subId] = undefined;
        delete subscribers[subId];
      }
    }
  }
  
  jas.Event = {
    addPublication: function (pubId) {
      //console.log(name);
      publications[pubId] = publication();
    },
    remPublication: function (pubId) {
      publications[pubId] = undefined;
      delete publications[pubId];
    },
    subscribe: function (pubId, subId, callback) {
      var name;
      if (arguments.length > 2) {
        name = subId;
        publications[pubId].addSubscriber(name, callback);
      }
      else if (typeof(subId) == "function") {
        name = subId.name? subId.name: "sub-" + subscriberAutoId ++;
        callback = subId;
        publications[pubId].addSubscriber(name, callback);
      }
      console.log(name);
      // return subscriber
      return {
        unsubscribe: function () {
          console.log(name);
          publications[pubId].removeSubscriber(name);
        },
        resubscribe: function () {
          publications[pubId].addSubscriber(name, callback);
        }
      };
    },
    unsubscribe: function (pubId, subId) {
      publications[pubId].removeSubscriber(subId);
    },
    publish: function (pubId, payload) {
      publications[pubId].publish(payload);
    }
  };
  
})(jas);
