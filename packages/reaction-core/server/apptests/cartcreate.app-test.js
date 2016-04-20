/* eslint dot-notation: 0 */

// it(
//   "should",
//   done => {
//
//     return done();
//   }
// );


describe("cart methods", function () {
  let user = Factory.create("user");
  const shop = faker.reaction.shops.getShop();
  let userId = user._id;
  // Required for creating a cart
  let originals = {};
  originals["mergeCart"] = Meteor.server
    .method_handlers["cart/mergeCart"];
  originals["copyCartToOrder"] = Meteor.server
    .method_handlers["cart/copyCartToOrder"];
  originals["addToCart"] = Meteor.server
    .method_handlers["cart/addToCart"];
  originals["setShipmentAddress"] = Meteor.server
    .method_handlers["cart/setShipmentAddress"];
  originals["setPaymentAddress"] = Meteor.server
    .method_handlers["cart/setPaymentAddress"];

  const sessionId = ReactionCore.sessionId = Random.id();

  function spyOnMethod(method, id) {
    return spyOn(Meteor.server.method_handlers, `cart/${method}`).and.callFake(
      function () {
        this.userId = id;
        return originals[method].apply(this, arguments);
      }
    );
  }

  afterAll(() => {
    Meteor.users.remove({});
  });


  describe("cart/createCart", function () {
    it("should create a test cart", function (done) {
      spyOnMethod("mergeCart", userId);
      spyOn(ReactionCore, "shopIdAutoValue").and.returnValue(shop._id);
      spyOn(ReactionCore, "getShopId").and.returnValue(shop._id);
      spyOn(ReactionCore.Collections.Cart, "insert").and.callThrough();
  
      let cartId = Meteor.call("cart/createCart", userId, sessionId);
      let cart = ReactionCore.Collections.Cart.findOne({
        userId: userId
      });
      expect(ReactionCore.Collections.Cart.insert).toHaveBeenCalled();
      expect(cartId).toEqual(cart._id);
  
      done();
    });
  });

});

