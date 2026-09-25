import { describe, it, expect } from "vitest";
import { computeParcelaStatus } from "../lib/finance/status";

const today = new Date("2026-06-15T12:00:00Z");

describe("computeParcelaStatus", () => {
  it("is pendente when not due yet and no payments", () => {
    const status = computeParcelaStatus(
      { valorCents: 1000, vencimento: "2026-07-01" },
      [],
      today
    );
    expect(status).toBe("pendente");
  });

  it("is vencido when due date has passed and no full payment", () => {
    const status = computeParcelaStatus(
      { valorCents: 1000, vencimento: "2026-06-01" },
      [],
      today
    );
    expect(status).toBe("vencido");
  });

  it("is pago when payments cover the full value, never just a manual flag", () => {
    const status = computeParcelaStatus(
      { valorCents: 1000, vencimento: "2026-06-01" },
      [{ valorPagoCents: 1000 }],
      today
    );
    expect(status).toBe("pago");
  });

  it("is pago when payments exceed the value slightly (overpayment)", () => {
    const status = computeParcelaStatus(
      { valorCents: 1000, vencimento: "2026-06-01" },
      [{ valorPagoCents: 1200 }],
      today
    );
    expect(status).toBe("pago");
  });

  it("is parcial with partial payment even if overdue", () => {
    const status = computeParcelaStatus(
      { valorCents: 1000, vencimento: "2026-06-01" },
      [{ valorPagoCents: 400 }],
      today
    );
    expect(status).toBe("parcial");
  });

  it("sums multiple partial payments before comparing to total", () => {
    const status = computeParcelaStatus(
      { valorCents: 1000, vencimento: "2026-07-01" },
      [{ valorPagoCents: 400 }, { valorPagoCents: 600 }],
      today
    );
    expect(status).toBe("pago");
  });

  it("is cancelado when marked cancelled regardless of dates/payments", () => {
    const status = computeParcelaStatus(
      { valorCents: 1000, vencimento: "2026-01-01", cancelada: true },
      [],
      today
    );
    expect(status).toBe("cancelado");
  });

  it("is pendente exactly on the due date (not yet vencido)", () => {
    const status = computeParcelaStatus(
      { valorCents: 1000, vencimento: "2026-06-15" },
      [],
      today
    );
    expect(status).toBe("pendente");
  });
});
