module.exports = {
  apps: [
    {
      name: "backend-main",
      script: "main.py",
      interpreter: "python3",
      cwd: "./backend",
      watch: false,
    },
    {
      name: "bridge-api",
      script: "bridge.py",
      interpreter: "python3",
      cwd: "./bridge",
      watch: false,
    },
  ],
};
