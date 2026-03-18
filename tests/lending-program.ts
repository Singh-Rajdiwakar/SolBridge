import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";

describe("lending_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.LendingProgram as anchor.Program;

  it("exposes collateral and borrow instructions", async () => {
    const instructionNames = program.idl.instructions.map((instruction) => instruction.name);
    expect(instructionNames).to.include("initializeLendingMarket");
    expect(instructionNames).to.include("depositCollateral");
    expect(instructionNames).to.include("borrowTokens");
    expect(instructionNames).to.include("repayTokens");
    expect(instructionNames).to.include("withdrawCollateral");
  });

  it("includes liquidation and admin parameter updates", async () => {
    const instructionNames = program.idl.instructions.map((instruction) => instruction.name);
    expect(instructionNames).to.include("liquidatePosition");
    expect(instructionNames).to.include("updateMarketParams");
    expect(instructionNames).to.include("pauseMarket");
    expect(instructionNames).to.include("resumeMarket");
  });
});
