import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { ServiceConfiguration } from "meteor/service-configuration";
import { Accounts } from "meteor/accounts-base";
import {
  Permissions,
  checkLoggedIn
} from "/imports/api/permissions/permissions";

if (Meteor.settings.public.keycloakEnabled === true) {
  ServiceConfiguration.configurations.upsert(
    { service: "keycloak" },
    {
      $set: {
        loginStyle: Meteor.settings.keycloak.loginStyle,
        serverUrl: Meteor.settings.keycloak.url,
        realm: Meteor.settings.keycloak.realm,
        clientId: Meteor.settings.keycloak.client,
        realmPublicKey: Meteor.settings.keycloak.pubkey,
        bearerOnly: false
      }
    }
  );
  // set up email and log user creation (Keycloak)
  Accounts.onCreateUser((_, user) => {
    if (user.services && user.services.keycloak) {
      const newUser = { ...user };
      /* eslint no-console:off */
      console.log("Creating new user after Keycloak authentication :");
      console.log(`  Keycloak id: ${user.services.keycloak.id}`);
      console.log(`  email: ${user.services.keycloak.email}`);
      newUser.emails = [{ address: user.services.keycloak.email, verified: true }];
      return newUser;
    }
    return user;
  });
  // server side login hook
  Accounts.onLogin((details) => {
    if (details.type === "keycloak") {
      // update user informations from keycloak service data
      const updateInfos = { profile: details.user.profile || {} };
      if (details.user.services.keycloak.given_name) {
        updateInfos.profile.firstName = details.user.services.keycloak.given_name;
      }
      if (details.user.services.keycloak.family_name) {
        updateInfos.profile.lastName = details.user.services.keycloak.family_name;
      }
      Meteor.users.update({ _id: details.user._id }, { $set: updateInfos });
      // update email if necessary
      // will fail if an existing user has the same email
      if (details.user.emails && details.user.emails[0]) {
        if (details.user.emails[0].address !== details.user.services.keycloak.email) {
          Accounts.removeEmail(details.user._id, details.user.emails[0].address);
          Accounts.addEmail(details.user._id, details.user.services.keycloak.email, true);
        }
      } else {
        // no email set yet
        Accounts.addEmail(details.user._id, details.user.services.keycloak.email, true);
      }
    }
  });
  // add method to associate existing account with a Keycloak Id
  Meteor.methods({
    "users.setKeycloakId"(email, keycloakId) {
      if (!Permissions.isAdmin(Meteor.userId())) {
        throw new Meteor.Error(401, "not-authorized");
      }
      check(email, String);
      check(keycloakId, String);
      const user = Accounts.findUserByEmail(email);
      if (user) {
        Meteor.users.update({_id:user._id}, {$set:{services:{keycloak:{id:keycloakId}}}});
        return user._id;
      }
      throw new Meteor.Error("user-not-found");
    }
  });
}
