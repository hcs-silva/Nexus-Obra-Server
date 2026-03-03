import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.model";

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

describe("Auth routes", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("POST /users/login returns 404 when user is not found", async () => {
    jest.spyOn(User, "findOne").mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as any);

    const response = await request(app)
      .post("/users/login")
      .send({ username: "missing", password: "password123" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found!");
  });

  it("POST /users/login sets auth cookie for valid credentials", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    jest.spyOn(User, "findOne").mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "u-1",
        username: "admin",
        password: hashedPassword,
        role: "Admin",
        clientId: "c-1",
        resetPassword: false,
      }),
    } as any);

    const response = await request(app)
      .post("/users/login")
      .send({ username: "admin", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]).toBeDefined();
    expect(response.body).toMatchObject({
      message: "Login successful",
      role: "Admin",
      clientId: "c-1",
    });
  });

  it("GET /users/me returns safe user profile", async () => {
    const token = jwt.sign(
      {
        _id: "507f1f77bcf86cd799439011",
        role: "Admin",
        clientId: "507f1f77bcf86cd799439012",
      },
      process.env.TOKEN_SECRET as string,
    );

    jest.spyOn(User, "findById").mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      username: "admin",
      role: "Admin",
      resetPassword: false,
      clientId: "507f1f77bcf86cd799439012",
      password: "should-not-leak",
    } as any);

    const response = await request(app)
      .get("/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      userId: "507f1f77bcf86cd799439011",
      username: "admin",
      role: "Admin",
    });
    expect(response.body.password).toBeUndefined();
  });
});
