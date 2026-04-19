// Conversão USD → BRL com taxa fixa + avisa que é aproximada.
// Quando tivermos serviço de FX real (iteração #4 de custos), troca aqui.

export const USD_BRL_RATE = 5.5;

export function usdToBrl(usd: number): number {
  return usd * USD_BRL_RATE;
}

export function formatBRL(usd: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usdToBrl(usd));
}

export function formatUSD(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd);
}
