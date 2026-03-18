import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";

describe("staking_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.StakingProgram as anchor.Program;

  it("exposes staking lifecycle instructions", async () => {
    const instructionNames = program.idl.instructions.map((instruction) => instruction.name);
    expect(instructionNames).to.include("initializeStakingConfig");
    expect(instructionNames).to.include("stakeTokens");
    expect(instructionNames).to.include("claimRewards");
    expect(instructionNames).to.include("unstakeTokens");
  });

  it("includes admin controls in the IDL", async () => {
    const instructionNames = program.idl.instructions.map((instruction) => instruction.name);
    expect(instructionNames).to.include("pauseStaking");
    expect(instructionNames).to.include("resumeStaking");
    expect(instructionNames).to.include("createLockPeriod");
    expect(instructionNames).to.include("updateLockPeriod");
  });

  it("models staking config counters in the accounts layout", async () => {
    const accountNames = program.idl.accounts?.map((account) => account.name) ?? [];
    expect(accountNames).to.include("stakingConfig");
    expect(accountNames).to.include("lockPeriod");
    expect(accountNames).to.include("stakePosition");
  });
});
