import { jest } from "@jest/globals";
import { NotificationType } from "@prisma/client";
import { prismaClient } from "../../src/libs/prismaClient.js";
import { notificationApi } from "../../src/libs/notificationService.js";
import { updateProduct } from "../../src/controllers/productController.js";

function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
}

describe("productController.updateProduct", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("does not create notifications when price is unchanged", async () => {
    const findUniqueSpy = jest.spyOn(prismaClient.product, "findUnique");
    const updateSpy = jest.spyOn(prismaClient.product, "update");
    const notificationSpy = jest.spyOn(notificationApi, "createNotification");

    findUniqueSpy.mockResolvedValue({
      id: 1,
      userId: 10,
      price: 1000,
      favorites: [{ userId: 20 }],
    } as never);
    updateSpy.mockResolvedValue({ id: 1, price: 1000 } as never);

    const req = {
      user: { id: 10 },
      params: { id: "1" },
      body: { price: 1000 },
    } as never;
    const res = createMockResponse();

    await updateProduct(req, res as never);

    expect(updateSpy).toHaveBeenCalled();
    expect(notificationSpy).not.toHaveBeenCalled();
  });

  test("creates notifications for unique favorite users except the owner on price change", async () => {
    const findUniqueSpy = jest.spyOn(prismaClient.product, "findUnique");
    const updateSpy = jest.spyOn(prismaClient.product, "update");
    const notificationSpy = jest.spyOn(notificationApi, "createNotification");

    findUniqueSpy.mockResolvedValue({
      id: 5,
      userId: 100,
      price: 1000,
      favorites: [
        { userId: 100 },
        { userId: 200 },
        { userId: 200 },
        { userId: 300 },
      ],
    } as never);
    updateSpy.mockResolvedValue({ id: 5, price: 1500 } as never);
    notificationSpy.mockResolvedValue({} as never);

    const req = {
      user: { id: 100 },
      params: { id: "5" },
      body: { price: 1500 },
    } as never;
    const res = createMockResponse();

    await updateProduct(req, res as never);

    expect(notificationSpy).toHaveBeenCalledTimes(2);
    expect(notificationSpy).toHaveBeenCalledWith({
      userId: 200,
      type: NotificationType.PRICE_CHANGED,
      payload: { productId: 5, oldPrice: 1000, newPrice: 1500 },
    });
    expect(notificationSpy).toHaveBeenCalledWith({
      userId: 300,
      type: NotificationType.PRICE_CHANGED,
      payload: { productId: 5, oldPrice: 1000, newPrice: 1500 },
    });
  });
});
