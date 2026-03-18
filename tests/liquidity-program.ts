import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";

describe("liquidity_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.LiquidityProgram as anchor.Program;

  it("exposes pool initialization and LP instructions", async () => {
    const instructionNames = program.idl.instructions.map((instruction) => instruction.name);
    expect(instructionNames).to.include("initializePool");
    expect(instructionNames).to.include("addLiquidity");
    expect(instructionNames).to.include("removeLiquidity");
  });

  it("exposes swap and fee management instructions", async () => {
    const instructionNames = program.idl.instructions.map((instruction) => instruction.name);
    expect(instructionNames).to.include("swapExactInput");
    expect(instructionNames).to.include("setPoolFee");
    expect(instructionNames).to.include("pausePool");
    expect(instructionNames).to.include("resumePool");
  });
});
