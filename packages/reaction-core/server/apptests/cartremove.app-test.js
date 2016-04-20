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

  // Required for creating a cart
  afterAll(() => {
    Meteor.users.remove({});
  });

  describe("cart/removeFromCart", function () {
    beforeEach(function () {
      ReactionCore.Collections.Cart.remove({});
    });

    it(
      "should remove item from cart",
      function (done) {
        let cart = Factory.create("cart");
        const cartUserId = cart.userId;

        spyOn(ReactionCore, "shopIdAutoValue").and.returnValue(shop._id);
        spyOn(ReactionCore, "getShopId").and.returnValue(shop._id);
        spyOn(Meteor, "userId").and.returnValue(cartUserId);
        spyOn(ReactionCore.Collections.Cart, "update").and.callThrough();

        cart = ReactionCore.Collections.Cart.findOne(cart._id);
        const cartItemId = cart.items[0]._id;
        expect(cart.items.length).toEqual(2);

        Meteor.call("cart/removeFromCart", cartItemId);

        // mongo update should be called
        expect(ReactionCore.Collections.Cart.update.calls.count()).toEqual(1);
        cart = ReactionCore.Collections.Cart.findOne(cart._id);

        // fixme: we expect decrease the number of items, but this does not
        // occur by some unknown reason
        // This was work for a while, but I forgot how I fix it :(
        // this test could be broken because of `shopIdAutoValue` if it is
        // setting shopId (`$set`) on `$pull`
        expect(cart.items.length).toEqual(1);

        return done();
      }
    );

    it(
      "should throw an exception when attempting to remove item from cart " +
      "of another user",
      done => {
        const cart = Factory.create("cart");
        const cartItemId = "testId123";
        spyOn(Meteor, "userId").and.returnValue(cart.userId);
        expect(() => {
          return Meteor.call("cart/removeFromCart", cartItemId);
        }).toThrow(new Meteor.Error(404, "Cart item not found.",
          "Unable to find an item with such id within you cart."));

        return done();
      }
    );

    it(
      "should throw an exception when attempting to remove non-existing item",
      done => {
        const cart = Factory.create("cart");
        const cartItemId = Random.id();
        spyOn(Meteor, "userId").and.returnValue(cart.userId);
        expect(() => {
          return Meteor.call("cart/removeFromCart", cartItemId);
        }).toThrow(new Meteor.Error(404, "Cart item not found.",
          "Unable to find an item with such id within you cart."));
        return done();
      }
    );
  });

});

