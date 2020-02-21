import { Meteor } from "meteor/meteor";
import { ServiceConfiguration } from "meteor/service-configuration";
import { Accounts } from "meteor/accounts-base";

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
  // server side login hook
  Accounts.onLogin(details => {
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
}
