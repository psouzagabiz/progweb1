import { describe, it, expect } from "vitest";
import { splitEvenly, generateInstallments } from "../lib/finance/installments";

describe("splitEvenly", () => {
  it("splits evenly when divisible", () => {
    const result = splitEvenly(10000, 10);
    expect(result).toEqual(new Array(10).fill(1000));
    expect(result.reduce((a, b) => a + b, 0)).toBe(10000);
  });

  it("puts remainder cents on the last installment", () => {
    const result = splitEvenly(10000, 3); // 3333.33... -> 3333,3333,3334
    expect(result[0]).toBe(3333);
    expect(result[1]).toBe(3333);
    expect(result[2]).toBe(3334);
    expect(result.reduce((a, b) => a + b, 0)).toBe(10000);
  });

  it("handles count of 1", () => {
    expect(splitEvenly(12345, 1)).toEqual([12345]);
  });

  it("handles zero total", () => {
    expect(splitEvenly(0, 5)).toEqual([0, 0, 0, 0, 0]);
  });
});

describe("generateInstallments", () => {
  it("generates buffet-style: 18000 total, 3000 entrada, 10x monthly parcelas summing exactly", () => {
    const parcelas = generateInstallments({
      valorTotalCents: 1_800_000,
      valorEntradaCents: 300_000,
      numParcelas: 10,
      dataContratacao: "2026-01-10",
      periodicidade: "mensal",
      intervaloDias: 30,
    });
    // entrada + 10 parcelas
    expect(parcelas.length).toBe(11);
    const sum = parcelas.reduce((s, p) => s + p.valorCents, 0);
    expect(sum).toBe(1_800_000);
    expect(parcelas[0].valorCents).toBe(300_000);
    expect(parcelas[0].label).toBe("Entrada");
    // remaining 1,500,000 / 10 = 150,000 exactly
    for (let i = 1; i <= 10; i++) {
      expect(parcelas[i].valorCents).toBe(150_000);
    }
  });

  it("generates photography-style: 6000 total, no entrada, 6x monthly", () => {
    const parcelas = generateInstallments({
      valorTotalCents: 600_000,
      valorEntradaCents: 0,
      numParcelas: 6,
      dataContratacao: "2026-02-01",
      periodicidade: "mensal",
      intervaloDias: 30,
    });
    expect(parcelas.length).toBe(6);
    const sum = parcelas.reduce((s, p) => s + p.valorCents, 0);
    expect(sum).toBe(600_000);
    expect(parcelas.every((p) => p.valorCents === 100_000)).toBe(true);
  });

  it("handles rounding remainder correctly with a non-divisible total", () => {
    const parcelas = generateInstallments({
      valorTotalCents: 1_000_000,
      valorEntradaCents: 0,
      numParcelas: 3,
      dataContratacao: "2026-01-01",
      periodicidade: "mensal",
      intervaloDias: 30,
    });
    const sum = parcelas.reduce((s, p) => s + p.valorCents, 0);
    expect(sum).toBe(1_000_000);
    // 1000000/3 = 333333.33 -> 333333, 333333, 333334
    expect(parcelas[2].valorCents).toBe(333_334);
  });

  it("à vista generates a single installment for the full value", () => {
    const parcelas = generateInstallments({
      valorTotalCents: 500_000,
      valorEntradaCents: 0,
      numParcelas: 0,
      dataContratacao: "2026-03-01",
      periodicidade: "mensal",
      intervaloDias: 30,
    });
    expect(parcelas.length).toBe(1);
    expect(parcelas[0].valorCents).toBe(500_000);
  });

  it("advances due dates correctly for quinzenal periodicity", () => {
    const parcelas = generateInstallments({
      valorTotalCents: 400_000,
      valorEntradaCents: 0,
      numParcelas: 4,
      dataContratacao: "2026-01-01",
      periodicidade: "quinzenal",
      intervaloDias: 30,
    });
    expect(parcelas[0].vencimento).toBe("2026-01-01");
    expect(parcelas[1].vencimento).toBe("2026-01-16");
    expect(parcelas[2].vencimento).toBe("2026-01-31");
  });
});
