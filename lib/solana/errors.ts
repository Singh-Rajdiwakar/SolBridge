export function normalizeSolanaError(error: unknown) {
  if (error instanceof Error) {
    const message = error.message;

    if (/User rejected|rejected the request|User declined/i.test(message)) {
      return "Transaction was rejected in the wallet.";
    }
    if (/insufficient funds|insufficient balance/i.test(message)) {
      return "Insufficient balance for this transaction.";
    }
    if (/0x1|custom program error: 0x1/i.test(message)) {
      return "The on-chain program rejected this request.";
    }
    if (/Account does not exist|Unknown action 'undefined'/i.test(message)) {
      return "Required on-chain account was not found on Devnet.";
    }
    if (/Simulation failed/i.test(message)) {
      return "Transaction simulation failed. Check account state and input values.";
    }

    return message;
  }

  return "Unexpected Solana error occurred.";
}

