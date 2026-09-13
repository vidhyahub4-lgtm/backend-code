const Session = require("../models/dev_super/session");

const dev_super_service = {
  createSession: async ({ session }) => {
    const newSession = new Session({
      session,
    });

    return await newSession.save();
  },

  getAllSession: async () => {
    return Session.find()
    .select("session")
    .sort({ createdAt: -1 });
  },
};

module.exports = dev_super_service;
