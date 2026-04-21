module.exports = {
  apps: [{
    name: "openclaw-dashboard",
    cwd: "/root/openclaw-dashboard",
    script: "npm",
    args: "start",
    env: {
      DATABASE_URL: "file:./dev.db",
      AUTH_SECRET: "yDUBshKoVjlvQcM2FbsQpoeuZG7LdvtMXM/L0h+n6TA=",
      NEXTAUTH_URL: "https://agents.magneticfunnels.io",
      AUTH_TRUST_HOST: "true",
      NODE_ENV: "production"
    }
  }]
};
