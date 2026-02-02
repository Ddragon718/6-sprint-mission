import http from "http";
import { PORT } from "./libs/constants.js";
import { app } from "./app.js";
import { initSocket } from "./libs/socket.js";

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
