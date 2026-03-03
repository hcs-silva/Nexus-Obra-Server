import request from "supertest";
import jwt from "jsonwebtoken";
import Obra from "../models/Obra.model";

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

describe("Obra routes", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("POST /obras/createObra blocks cross-tenant create for non-masterAdmin", async () => {
    const token = jwt.sign(
      {
        _id: "507f1f77bcf86cd799439011",
        role: "Admin",
        clientId: "507f1f77bcf86cd799439012",
      },
      process.env.TOKEN_SECRET as string,
    );

    const response = await request(app)
      .post("/obras/createObra")
      .set("Authorization", `Bearer ${token}`)
      .send({
        obraName: "Obra X",
        clientId: "507f1f77bcf86cd799439013",
        obraStatus: "planning",
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toContain(
      "Cannot create obra for another client",
    );
  });

  it("GET /obras returns obra list for authenticated user", async () => {
    const token = jwt.sign(
      {
        _id: "507f1f77bcf86cd799439011",
        role: "Admin",
        clientId: "507f1f77bcf86cd799439012",
      },
      process.env.TOKEN_SECRET as string,
    );

    const secondPopulate = jest.fn().mockResolvedValue([
      {
        _id: "507f1f77bcf86cd799439099",
        obraName: "Obra A",
      },
    ]);
    const firstPopulate = jest
      .fn()
      .mockReturnValue({ populate: secondPopulate });

    jest.spyOn(Obra, "find").mockReturnValue({
      populate: firstPopulate,
    } as any);

    const response = await request(app)
      .get("/obras")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].obraName).toBe("Obra A");
  });
});
