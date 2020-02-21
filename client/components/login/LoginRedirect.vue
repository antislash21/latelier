<template>
</template>

<script>
export default {
  name: "LoginRedirect",
  mounted: function () {
    this.$notify(this.$t("Welcome back!"));
    Meteor.call("permissions.setAdminIfNeeded");
    this.$router.push({ name: "dashboard-page" });
  },
};
</script>
