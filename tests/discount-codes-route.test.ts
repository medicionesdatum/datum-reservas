import { beforeEach, describe, expect, it, vi } from "vitest";

const findUsableDiscount = vi.fn();

vi.mock("@/lib/discount-codes", () => ({
  findUsableDiscount: (...args: unknown[]) => findUsableDiscount(...args)
}));

import { GET } from "@/app/api/discount-codes/route";
import { services } from "@/lib/pricing";

const discount = { code: "TEST", type: "percentage", value: 10 };

function request(serviceId: string, surface = 120) {
  return new Request(
    `https://medicionesdatum.es/api/discount-codes?code=TEST&serviceId=${serviceId}&surface=${surface}`,
    { headers: { "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}` } }
  );
}

describe("GET /api/discount-codes", () => {
  beforeEach(() => {
    findUsableDiscount.mockReset();
    findUsableDiscount.mockResolvedValue(discount);
  });

  it("acepta códigos para todos los servicios reservables", async () => {
    for (const serviceId of Object.keys(services)) {
      const response = await GET(request(serviceId));
      expect((await response.json()).discount, serviceId).toEqual(discount);
    }
  });

  it("calcula el subtotal con el precio del servicio (Solo planta, 120 m² = 375 €)", async () => {
    await GET(request("plans_floor"));
    expect(findUsableDiscount.mock.calls[0][1]).toBe(375);
  });

  it("rechaza servicios desconocidos", async () => {
    const response = await GET(request("otro"));
    expect((await response.json()).discount).toBeNull();
  });
});
