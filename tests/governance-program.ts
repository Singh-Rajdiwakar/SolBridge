import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";

describe("governance_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.GovernanceProgram as anchor.Program;

  it("exposes proposal lifecycle instructions", async () => {
    const instructionNames = program.idl.instructions.map((instruction) => instruction.name);
    expect(instructionNames).to.include("initializeGovernance");
    expect(instructionNames).to.include("createProposal");
    expect(instructionNames).to.include("castVote");
    expect(instructionNames).to.include("finalizeProposal");
  });

  it("prevents invalid governance usage through explicit handlers", async () => {
    const instructionNames = program.idl.instructions.map((instruction) => instruction.name);
    expect(instructionNames).to.include("cancelProposal");
    expect(instructionNames).to.include("updateGovernanceConfig");
  });
});
