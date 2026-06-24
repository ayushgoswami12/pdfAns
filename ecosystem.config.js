module.exports = {
  apps: [
    { name: "backend", script: "python", args: "server.py", cwd: "D:\\pdfReader" },
    { name: "frontend", script: "npm", args: "run dev", cwd: "D:\\pdfReader\\rag-frontend" }
  ]
}