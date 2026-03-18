import * as anchor from "@coral-xyz/anchor";

module.exports = async function deploy(provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);

  // Anchor deploys the programs declared in Anchor.toml. Runtime bootstrap
  // such as config initialization is intentionally left to the frontend/admin
  // flow so the dashboard can exercise signed setup transactions end-to-end.
  // This file exists to keep the workspace deployable with the standard
  // `anchor deploy` flow.
  // eslint-disable-next-line no-console
  console.log("SolanaBlocks programs deployed to", provider.connection.rpcEndpoint);
};
