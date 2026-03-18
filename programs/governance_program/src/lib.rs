use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

declare_id!("7e4gvpizQZ12dGWHFXekKrrX8ByktwvV3t48HnG9xBNz");

const MAX_TITLE_LEN: usize = 80;
const MAX_METADATA_URI_LEN: usize = 200;

#[program]
pub mod governance_program {
    use super::*;

    pub fn initialize_governance(
        ctx: Context<InitializeGovernance>,
        quorum_bps: u64,
        voting_duration_seconds: i64,
        proposal_threshold: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.governance_mint = ctx.accounts.governance_mint.key();
        config.quorum_bps = quorum_bps;
        config.voting_duration_seconds = voting_duration_seconds;
        config.proposal_threshold = proposal_threshold;
        config.bump = ctx.bumps.config;

        emit!(GovernanceInitialized {
            admin: config.admin,
            governance_mint: config.governance_mint,
            quorum_bps,
            voting_duration_seconds,
        });

        Ok(())
    }

    pub fn update_governance_config(
        ctx: Context<UpdateGovernanceConfig>,
        quorum_bps: u64,
        voting_duration_seconds: i64,
        proposal_threshold: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.quorum_bps = quorum_bps;
        config.voting_duration_seconds = voting_duration_seconds;
        config.proposal_threshold = proposal_threshold;

        emit!(GovernanceConfigUpdated {
            admin: ctx.accounts.admin.key(),
            quorum_bps,
            voting_duration_seconds,
            proposal_threshold,
        });

        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        proposal_id: u64,
        title: String,
        metadata_uri: String,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        require!(title.len() <= MAX_TITLE_LEN, GovernanceError::TitleTooLong);
        require!(
            metadata_uri.len() <= MAX_METADATA_URI_LEN,
            GovernanceError::MetadataUriTooLong
        );
        require!(end_time > start_time, GovernanceError::InvalidVotingWindow);
        require!(
            ctx.accounts.proposer_governance_account.amount >= ctx.accounts.config.proposal_threshold,
            GovernanceError::ProposalThresholdNotMet
        );

        let proposal = &mut ctx.accounts.proposal;
        proposal.config = ctx.accounts.config.key();
        proposal.proposal_id = proposal_id;
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.title = title;
        proposal.metadata_uri = metadata_uri;
        proposal.start_time = start_time;
        proposal.end_time = end_time;
        proposal.votes_yes = 0;
        proposal.votes_no = 0;
        proposal.votes_abstain = 0;
        proposal.status = ProposalStatus::Pending;
        proposal.executed = false;
        proposal.bump = ctx.bumps.proposal;

        emit!(ProposalCreated {
            proposer: proposal.proposer,
            proposal: ctx.accounts.proposal.key(),
            start_time,
            end_time,
        });

        Ok(())
    }

    pub fn cast_vote(ctx: Context<CastVote>, vote_type: VoteType) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let proposal = &mut ctx.accounts.proposal;
        require!(now >= proposal.start_time, GovernanceError::VotingNotStarted);
        require!(now <= proposal.end_time, GovernanceError::VotingEnded);
        require!(
            proposal.status == ProposalStatus::Pending || proposal.status == ProposalStatus::Active,
            GovernanceError::ProposalClosed
        );

        proposal.status = ProposalStatus::Active;

        let voting_power = ctx.accounts.voter_governance_account.amount;
        require!(voting_power > 0, GovernanceError::NoVotingPower);

        let vote_record = &mut ctx.accounts.vote_record;
        vote_record.proposal = proposal.key();
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.vote_type = vote_type.clone();
        vote_record.voting_power = voting_power;
        vote_record.bump = ctx.bumps.vote_record;

        match vote_type {
            VoteType::Yes => {
                proposal.votes_yes = proposal
                    .votes_yes
                    .checked_add(voting_power)
                    .ok_or(GovernanceError::MathOverflow)?;
            }
            VoteType::No => {
                proposal.votes_no = proposal
                    .votes_no
                    .checked_add(voting_power)
                    .ok_or(GovernanceError::MathOverflow)?;
            }
            VoteType::Abstain => {
                proposal.votes_abstain = proposal
                    .votes_abstain
                    .checked_add(voting_power)
                    .ok_or(GovernanceError::MathOverflow)?;
            }
        }

        emit!(VoteCast {
            voter: ctx.accounts.voter.key(),
            proposal: proposal.key(),
            voting_power,
            vote_type,
        });

        Ok(())
    }

    pub fn finalize_proposal(ctx: Context<FinalizeProposal>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let proposal = &mut ctx.accounts.proposal;
        require!(now > proposal.end_time, GovernanceError::VotingStillOpen);
        require!(
            proposal.status == ProposalStatus::Pending || proposal.status == ProposalStatus::Active,
            GovernanceError::ProposalClosed
        );

        let supply = ctx.accounts.governance_mint.supply.max(1);
        let total_votes = proposal
            .votes_yes
            .checked_add(proposal.votes_no)
            .and_then(|value| value.checked_add(proposal.votes_abstain))
            .ok_or(GovernanceError::MathOverflow)?;
        let quorum_reached = (total_votes as u128)
            .checked_mul(10_000)
            .and_then(|value| value.checked_div(supply as u128))
            .ok_or(GovernanceError::MathOverflow)?
            >= ctx.accounts.config.quorum_bps as u128;

        proposal.status = if quorum_reached && proposal.votes_yes > proposal.votes_no {
            ProposalStatus::Passed
        } else {
            ProposalStatus::Rejected
        };

        emit!(ProposalFinalized {
            proposal: proposal.key(),
            status: proposal.status.clone(),
            total_votes,
        });

        Ok(())
    }

    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        require!(
            proposal.status == ProposalStatus::Pending,
            GovernanceError::ProposalClosed
        );
        proposal.status = ProposalStatus::Cancelled;
        emit!(ProposalCancelled {
            proposal: proposal.key(),
            authority: ctx.accounts.authority.key(),
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeGovernance<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + GovernanceConfig::LEN,
        seeds = [b"governance-config"],
        bump
    )]
    pub config: Account<'info, GovernanceConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub governance_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateGovernanceConfig<'info> {
    #[account(mut, has_one = admin, seeds = [b"governance-config"], bump = config.bump)]
    pub config: Account<'info, GovernanceConfig>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct CreateProposal<'info> {
    #[account(seeds = [b"governance-config"], bump = config.bump)]
    pub config: Account<'info, GovernanceConfig>,
    #[account(
        init,
        payer = proposer,
        space = 8 + Proposal::LEN,
        seeds = [b"proposal", &proposal_id.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    #[account(
        constraint = proposer_governance_account.owner == proposer.key(),
        constraint = proposer_governance_account.mint == config.governance_mint
    )]
    pub proposer_governance_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(seeds = [b"governance-config"], bump = config.bump)]
    pub config: Account<'info, GovernanceConfig>,
    #[account(mut, seeds = [b"proposal", &proposal.proposal_id.to_le_bytes()], bump = proposal.bump)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::LEN,
        seeds = [b"vote-record", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(
        constraint = voter_governance_account.owner == voter.key(),
        constraint = voter_governance_account.mint == config.governance_mint
    )]
    pub voter_governance_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeProposal<'info> {
    #[account(seeds = [b"governance-config"], bump = config.bump)]
    pub config: Account<'info, GovernanceConfig>,
    #[account(mut, seeds = [b"proposal", &proposal.proposal_id.to_le_bytes()], bump = proposal.bump)]
    pub proposal: Account<'info, Proposal>,
    pub governance_mint: Account<'info, Mint>,
}

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(seeds = [b"governance-config"], bump = config.bump)]
    pub config: Account<'info, GovernanceConfig>,
    #[account(
        mut,
        seeds = [b"proposal", &proposal.proposal_id.to_le_bytes()],
        bump = proposal.bump,
        constraint = proposal.proposer == authority.key() || config.admin == authority.key()
    )]
    pub proposal: Account<'info, Proposal>,
    pub authority: Signer<'info>,
}

#[account]
pub struct GovernanceConfig {
    pub admin: Pubkey,
    pub governance_mint: Pubkey,
    pub quorum_bps: u64,
    pub voting_duration_seconds: i64,
    pub proposal_threshold: u64,
    pub bump: u8,
}

impl GovernanceConfig {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 8 + 1;
}

#[account]
pub struct Proposal {
    pub config: Pubkey,
    pub proposal_id: u64,
    pub proposer: Pubkey,
    pub title: String,
    pub metadata_uri: String,
    pub start_time: i64,
    pub end_time: i64,
    pub votes_yes: u64,
    pub votes_no: u64,
    pub votes_abstain: u64,
    pub status: ProposalStatus,
    pub executed: bool,
    pub bump: u8,
}

impl Proposal {
    pub const LEN: usize =
        32 + 8 + 32 + 4 + MAX_TITLE_LEN + 4 + MAX_METADATA_URI_LEN + (8 * 5) + 1 + 1 + 1;
}

#[account]
pub struct VoteRecord {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub vote_type: VoteType,
    pub voting_power: u64,
    pub bump: u8,
}

impl VoteRecord {
    pub const LEN: usize = 32 + 32 + 1 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalStatus {
    Pending,
    Active,
    Passed,
    Rejected,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VoteType {
    Yes,
    No,
    Abstain,
}

#[event]
pub struct GovernanceInitialized {
    pub admin: Pubkey,
    pub governance_mint: Pubkey,
    pub quorum_bps: u64,
    pub voting_duration_seconds: i64,
}

#[event]
pub struct GovernanceConfigUpdated {
    pub admin: Pubkey,
    pub quorum_bps: u64,
    pub voting_duration_seconds: i64,
    pub proposal_threshold: u64,
}

#[event]
pub struct ProposalCreated {
    pub proposer: Pubkey,
    pub proposal: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
}

#[event]
pub struct VoteCast {
    pub voter: Pubkey,
    pub proposal: Pubkey,
    pub voting_power: u64,
    pub vote_type: VoteType,
}

#[event]
pub struct ProposalFinalized {
    pub proposal: Pubkey,
    pub status: ProposalStatus,
    pub total_votes: u64,
}

#[event]
pub struct ProposalCancelled {
    pub proposal: Pubkey,
    pub authority: Pubkey,
}

#[error_code]
pub enum GovernanceError {
    #[msg("Proposal title exceeds the supported size.")]
    TitleTooLong,
    #[msg("Proposal metadata URI exceeds the supported size.")]
    MetadataUriTooLong,
    #[msg("Voting window is invalid.")]
    InvalidVotingWindow,
    #[msg("Proposal threshold has not been met.")]
    ProposalThresholdNotMet,
    #[msg("Voting has not started.")]
    VotingNotStarted,
    #[msg("Voting has already ended.")]
    VotingEnded,
    #[msg("This proposal is already closed.")]
    ProposalClosed,
    #[msg("Voting is still open.")]
    VotingStillOpen,
    #[msg("The voter has no governance voting power.")]
    NoVotingPower,
    #[msg("Arithmetic overflow detected.")]
    MathOverflow,
}
