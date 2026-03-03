import request from "supertest";
import jwt from "jsonwebtoken";
import Client from "../models/Client.model";

jest.mock("../db", () => ({
  __esModule: true,
  isDbConnected: () => false,
  getDbReadyState: () => 0,
  closeDbConnection: async () => undefined,
}));

jest.mock("../middlewares/rateLimitMiddleware", () => ({
  __esModule: true,
  default: (_req: any, _res: any, next: any) => next(),
  authRateLimiter: (_req: any, _res: any, next: any) => next(),
}));

import app from "../app";

describe("Client routes", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("GET /clients returns only own client for Admin", async () => {
    const clientId = "507f1f77bcf86cd799439012";
    const token = jwt.sign(
      {
        _id: "507f1f77bcf86cd799439011",
        role: "Admin",
        clientId,
      },
      process.env.TOKEN_SECRET as string,
    );

    jest.spyOn(Client, "findById").mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: clientId,
        clientName: "Acme",
      }),
    } as any);

    const response = await request(app)
      .get("/clients")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]._id).toBe(clientId);
  });

  it("GET /clients/:clientId blocks admin from other tenant", async () => {
    const token = jwt.sign(
      {
        _id: "507f1f77bcf86cd799439011",
        role: "Admin",
        clientId: "507f1f77bcf86cd799439012",
      },
      process.env.TOKEN_SECRET as string,
    );

    const response = await request(app)
      .get("/clients/507f1f77bcf86cd799439099")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toContain("Access denied");
  });
});
