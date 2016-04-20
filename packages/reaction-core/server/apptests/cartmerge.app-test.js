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

  describe("cart/mergeCart", () => {
    beforeAll(() => {
      // We are mocking inventory hooks, because we don't need them here, but
      // if you want to do a real stress test, you could try to comment out
      // this two lines and uncomment the following spyOn line. This is needed
      // only for `./reaction test`. In one package test this is ignoring.
      if (Array.isArray(ReactionCore.Collections.Products._hookAspects.remove.after) && ReactionCore.Collections.Products._hookAspects.remove.after.length) {
        spyOn(ReactionCore.Collections.Cart._hookAspects.update.after[0],
          "aspect");
        spyOn(ReactionCore.Collections.Products._hookAspects.remove.after[0],
          "aspect");
      }

      // this is needed for `inventory/remove`. Don't ask me why;)
      // spyOn(ReactionCore, "hasPermission").and.returnValue(true);
      ReactionCore.Collections.Products.remove({});

      // mock it. If you want to make full integration test, comment this out
      spyOn(Meteor.server.method_handlers, "workflow/pushCartWorkflow").and.callFake(() => true);
    });

    beforeEach(() => {
      ReactionCore.Collections.Cart.remove({});
    });

    it(
      "should merge all `anonymous` carts into existent `normal` user cart" +
      " per session, when logged in",
      () => {
        let anonymousCart = Factory.create("anonymousCart");
        let cart = Factory.create("cart");
        spyOnMethod("mergeCart", cart.userId);
        spyOn(ReactionCore, "getShopId").and.returnValue(shop._id);
        spyOn(ReactionCore.Collections.Cart, "remove").and.callThrough();
        ReactionCore.Collections.Cart.update({}, {
          $set: {
            sessionId: sessionId
          }
        });

        Meteor.call("cart/mergeCart", cart._id, sessionId);
        anonymousCart = ReactionCore.Collections.Cart.findOne(anonymousCart._id);
        cart = ReactionCore.Collections.Cart.findOne(cart._id);

        expect(ReactionCore.Collections.Cart.remove).toHaveBeenCalled();
        expect(anonymousCart).toBeUndefined();
        expect(cart.items.length).toBe(2);
      }
    );

    it(
      "should merge only into registered user cart",
      done => {
        const cart = Factory.create("anonymousCart");
        spyOnMethod("mergeCart", cart.userId);
        spyOn(ReactionCore, "getShopId").and.returnValue(shop._id);
        const cartId = cart._id;

        // now we try to merge two anonymous carts. We expect to see `false`
        // result
        expect(Meteor.call("cart/mergeCart", cartId)).toBeFalsy();

        return done();
      }
    );

    it(
      "should throw an error if cart doesn't exist",
      done => {
        spyOnMethod("mergeCart", "someIdHere");
        expect(() => {
          return Meteor.call("cart/mergeCart", "cartIdHere", sessionId);
        }).toThrow(new Meteor.Error(403, "Access Denied"));

        return done();
      }
    );
    it(
      "should throw an error if cart user is not current user",
      done => {
        let cart = Factory.create("cart");
        spyOnMethod("mergeCart", "someIdHere");
        expect(() => {
          return Meteor.call("cart/mergeCart", cart._id, sessionId);
        }).toThrow(new Meteor.Error(403, "Access Denied"));
        return done();
      }
    );
  });
});
