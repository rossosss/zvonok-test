// pages/api/socket/io.ts
import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import type { NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: any) => {

  if (!res.socket.server.io) {
    
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: "/api/socket/io",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === "production" 
          ? process.env.NEXT_PUBLIC_SITE_URL 
          : "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default ioHandler;
