use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("ALnc8ohCRM5WMD4yksGS9XuZDzGCH3vW2VHUzn9Rb762");

const SECONDS_PER_DAY: i64 = 86_400;
const SECONDS_PER_YEAR: i128 = 31_536_000;
const MAX_LOCK_LABEL_LEN: usize = 32;

#[program]
pub mod staking_program {
    use super::*;

    pub fn initialize_staking_config(
        ctx: Context<InitializeStakingConfig>,
        reward_rate_bps: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.staking_mint = ctx.accounts.staking_mint.key();
        config.reward_mint = ctx.accounts.reward_mint.key();
        config.treasury_vault = ctx.accounts.treasury_vault.key();
        config.reward_vault = ctx.accounts.reward_vault.key();
        config.reward_rate_bps = reward_rate_bps;
        config.staking_enabled = true;
        config.total_staked = 0;
        config.number_of_lock_periods = 0;
        config.bump = ctx.bumps.config;

        emit!(StakingConfigInitialized {
            admin: config.admin,
            staking_mint: config.staking_mint,
            reward_mint: config.reward_mint,
            reward_rate_bps,
        });

        Ok(())
    }

    pub fn create_lock_period(
        ctx: Context<CreateLockPeriod>,
        label: String,
        duration_days: u64,
        apy_bps: u64,
        min_amount: u64,
        early_unstake_penalty_bps: u64,
        early_unstake_enabled: bool,
    ) -> Result<()> {
        require!(duration_days > 0, StakingError::InvalidLockDuration);
        require!(label.len() <= MAX_LOCK_LABEL_LEN, StakingError::InvalidLockLabel);

        let lock_period = &mut ctx.accounts.lock_period;
        lock_period.config = ctx.accounts.config.key();
        lock_period.label = label.clone();
        lock_period.duration_days = duration_days;
        lock_period.apy_bps = apy_bps;
        lock_period.min_amount = min_amount;
        lock_period.early_unstake_penalty_bps = early_unstake_penalty_bps;
        lock_period.early_unstake_enabled = early_unstake_enabled;
        lock_period.enabled = true;
        lock_period.bump = ctx.bumps.lock_period;
        ctx.accounts.config.number_of_lock_periods = ctx.accounts.config.number_of_lock_periods.saturating_add(1);

        emit!(LockPeriodUpserted {
            config: ctx.accounts.config.key(),
            label,
            duration_days,
            apy_bps,
            enabled: true,
        });

        Ok(())
    }

    pub fn update_lock_period(
        ctx: Context<UpdateLockPeriod>,
        apy_bps: u64,
        min_amount: u64,
        early_unstake_penalty_bps: u64,
        early_unstake_enabled: bool,
        enabled: bool,
    ) -> Result<()> {
        let lock_period = &mut ctx.accounts.lock_period;
        lock_period.apy_bps = apy_bps;
        lock_period.min_amount = min_amount;
        lock_period.early_unstake_penalty_bps = early_unstake_penalty_bps;
        lock_period.early_unstake_enabled = early_unstake_enabled;
        lock_period.enabled = enabled;

        emit!(LockPeriodUpserted {
            config: ctx.accounts.config.key(),
            label: lock_period.label.clone(),
            duration_days: lock_period.duration_days,
            apy_bps,
            enabled,
        });

        Ok(())
    }

    pub fn stake_tokens(
        ctx: Context<StakeTokens>,
        amount: u64,
        position_nonce: u64,
    ) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);
        require!(ctx.accounts.config.staking_enabled, StakingError::StakingPaused);
        require!(ctx.accounts.lock_period.enabled, StakingError::LockPeriodDisabled);
        require!(
            amount >= ctx.accounts.lock_period.min_amount,
            StakingError::BelowMinimumStake
        );

        let now = Clock::get()?.unix_timestamp;
        let owner = ctx.accounts.owner.key();
        let config_key = ctx.accounts.config.key();
        let lock_period_key = ctx.accounts.lock_period.key();
        let stake_mint = ctx.accounts.config.staking_mint;
        let lock_duration_days = ctx.accounts.lock_period.duration_days;
        let end_time = now + (lock_duration_days as i64 * SECONDS_PER_DAY);

        token::transfer(ctx.accounts.transfer_to_vault_context(), amount)?;

        let position = &mut ctx.accounts.position;
        position.owner = owner;
        position.config = config_key;
        position.lock_period = lock_period_key;
        position.stake_mint = stake_mint;
        position.staked_amount = amount;
        position.lock_duration_days = lock_duration_days;
        position.start_time = now;
        position.end_time = end_time;
        position.reward_debt = 0;
        position.claimed_rewards = 0;
        position.unstaked = false;
        position.position_nonce = position_nonce;
        position.bump = ctx.bumps.position;
        ctx.accounts.config.total_staked = ctx.accounts.config.total_staked
            .checked_add(amount)
            .ok_or(StakingError::MathOverflow)?;

        emit!(StakePositionCreated {
            owner,
            position: ctx.accounts.position.key(),
            amount,
            duration_days: lock_duration_days,
            start_time: now,
            end_time,
        });

        Ok(())
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let claimable = claimable_rewards(&ctx.accounts.position, &ctx.accounts.lock_period)?;
        require!(claimable > 0, StakingError::NoRewardsAvailable);

        {
            let position = &mut ctx.accounts.position;
            position.claimed_rewards = position
                .claimed_rewards
                .checked_add(claimable)
                .ok_or(StakingError::MathOverflow)?;
            position.reward_debt = 0;
        }

        let config_bump = [ctx.accounts.config.bump];
        let signer_seed_slice: &[&[u8]] = &[b"staking-config", &config_bump];
        let signer_seeds: &[&[&[u8]]] = &[signer_seed_slice];
        let rewards_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.reward_vault.to_account_info(),
                to: ctx.accounts.user_reward_account.to_account_info(),
                authority: ctx.accounts.config.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(rewards_ctx, claimable)?;

        emit!(RewardsClaimed {
            owner: ctx.accounts.owner.key(),
            position: ctx.accounts.position.key(),
            amount: claimable,
        });

        Ok(())
    }

    pub fn unstake_tokens(ctx: Context<UnstakeTokens>) -> Result<()> {
        require!(!ctx.accounts.position.unstaked, StakingError::AlreadyUnstaked);

        let now = Clock::get()?.unix_timestamp;
        let matured = now >= ctx.accounts.position.end_time;
        let mut payout = ctx.accounts.position.staked_amount;

        if !matured {
            require!(
                ctx.accounts.lock_period.early_unstake_enabled,
                StakingError::StakeStillLocked
            );
            payout = apply_penalty(
                payout,
                ctx.accounts.lock_period.early_unstake_penalty_bps,
            )?;
        }

        let pending_rewards = claimable_rewards(&ctx.accounts.position, &ctx.accounts.lock_period)?;
        let staked_amount = ctx.accounts.position.staked_amount;

        {
            let position = &mut ctx.accounts.position;
            position.unstaked = true;
            position.reward_debt = 0;
            position.claimed_rewards = position
                .claimed_rewards
                .checked_add(pending_rewards)
                .ok_or(StakingError::MathOverflow)?;
        }
        ctx.accounts.config.total_staked = ctx.accounts.config.total_staked
            .checked_sub(staked_amount)
            .ok_or(StakingError::MathOverflow)?;

        let config_bump = [ctx.accounts.config.bump];
        let signer_seed_slice: &[&[u8]] = &[b"staking-config", &config_bump];
        let signer_seeds: &[&[&[u8]]] = &[signer_seed_slice];
        let principal_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.treasury_vault.to_account_info(),
                to: ctx.accounts.user_stake_account.to_account_info(),
                authority: ctx.accounts.config.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(principal_ctx, payout)?;

        if pending_rewards > 0 {
            let reward_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.reward_vault.to_account_info(),
                    to: ctx.accounts.user_reward_account.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                signer_seeds,
            );
            token::transfer(reward_ctx, pending_rewards)?;
        }

        emit!(StakePositionClosed {
            owner: ctx.accounts.owner.key(),
            position: ctx.accounts.position.key(),
            principal_returned: payout,
            reward_paid: pending_rewards,
        });

        Ok(())
    }

    pub fn pause_staking(ctx: Context<UpdateProtocolState>) -> Result<()> {
        ctx.accounts.config.staking_enabled = false;
        emit!(ProtocolPauseStateChanged {
            admin: ctx.accounts.admin.key(),
            paused: true,
        });
        Ok(())
    }

    pub fn resume_staking(ctx: Context<UpdateProtocolState>) -> Result<()> {
        ctx.accounts.config.staking_enabled = true;
        emit!(ProtocolPauseStateChanged {
            admin: ctx.accounts.admin.key(),
            paused: false,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeStakingConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + StakingConfig::LEN,
        seeds = [b"staking-config"],
        bump
    )]
    pub config: Account<'info, StakingConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub staking_mint: Account<'info, Mint>,
    pub reward_mint: Account<'info, Mint>,
    #[account(mut, constraint = treasury_vault.mint == staking_mint.key())]
    pub treasury_vault: Account<'info, TokenAccount>,
    #[account(mut, constraint = reward_vault.mint == reward_mint.key())]
    pub reward_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(duration_days: u64)]
pub struct CreateLockPeriod<'info> {
    #[account(mut, has_one = admin, seeds = [b"staking-config"], bump = config.bump)]
    pub config: Account<'info, StakingConfig>,
    #[account(
        init,
        payer = admin,
        space = 8 + LockPeriod::LEN,
        seeds = [b"lock-period".as_ref(), &duration_days.to_le_bytes()],
        bump
    )]
    pub lock_period: Account<'info, LockPeriod>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateLockPeriod<'info> {
    #[account(has_one = admin, seeds = [b"staking-config"], bump = config.bump)]
    pub config: Account<'info, StakingConfig>,
    #[account(mut, seeds = [b"lock-period", &lock_period.duration_days.to_le_bytes()], bump = lock_period.bump)]
    pub lock_period: Account<'info, LockPeriod>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(amount: u64, position_nonce: u64)]
pub struct StakeTokens<'info> {
    #[account(seeds = [b"staking-config"], bump = config.bump)]
    pub config: Account<'info, StakingConfig>,
    #[account(
        seeds = [b"lock-period", &lock_period.duration_days.to_le_bytes()],
        bump = lock_period.bump,
        constraint = lock_period.config == config.key()
    )]
    pub lock_period: Account<'info, LockPeriod>,
    #[account(
        init,
        payer = owner,
        space = 8 + StakePosition::LEN,
        seeds = [b"stake-position", owner.key().as_ref(), &position_nonce.to_le_bytes()],
        bump
    )]
    pub position: Account<'info, StakePosition>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        constraint = user_stake_account.owner == owner.key(),
        constraint = user_stake_account.mint == config.staking_mint
    )]
    pub user_stake_account: Account<'info, TokenAccount>,
    #[account(mut, address = config.treasury_vault)]
    pub treasury_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(seeds = [b"staking-config"], bump = config.bump)]
    pub config: Account<'info, StakingConfig>,
    #[account(
        seeds = [b"lock-period", &lock_period.duration_days.to_le_bytes()],
        bump = lock_period.bump
    )]
    pub lock_period: Account<'info, LockPeriod>,
    #[account(
        mut,
        has_one = owner,
        constraint = position.config == config.key(),
        constraint = position.lock_period == lock_period.key()
    )]
    pub position: Account<'info, StakePosition>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, address = config.reward_vault)]
    pub reward_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_reward_account.owner == owner.key(),
        constraint = user_reward_account.mint == config.reward_mint
    )]
    pub user_reward_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UnstakeTokens<'info> {
    #[account(seeds = [b"staking-config"], bump = config.bump)]
    pub config: Account<'info, StakingConfig>,
    #[account(
        seeds = [b"lock-period", &lock_period.duration_days.to_le_bytes()],
        bump = lock_period.bump
    )]
    pub lock_period: Account<'info, LockPeriod>,
    #[account(
        mut,
        has_one = owner,
        constraint = position.config == config.key(),
        constraint = position.lock_period == lock_period.key()
    )]
    pub position: Account<'info, StakePosition>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        constraint = user_stake_account.owner == owner.key(),
        constraint = user_stake_account.mint == config.staking_mint
    )]
    pub user_stake_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_reward_account.owner == owner.key(),
        constraint = user_reward_account.mint == config.reward_mint
    )]
    pub user_reward_account: Account<'info, TokenAccount>,
    #[account(mut, address = config.treasury_vault)]
    pub treasury_vault: Account<'info, TokenAccount>,
    #[account(mut, address = config.reward_vault)]
    pub reward_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateProtocolState<'info> {
    #[account(mut, has_one = admin, seeds = [b"staking-config"], bump = config.bump)]
    pub config: Account<'info, StakingConfig>,
    pub admin: Signer<'info>,
}

impl<'info> StakeTokens<'info> {
    fn transfer_to_vault_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.user_stake_account.to_account_info(),
                to: self.treasury_vault.to_account_info(),
                authority: self.owner.to_account_info(),
            },
        )
    }
}

#[account]
pub struct StakingConfig {
    pub admin: Pubkey,
    pub staking_mint: Pubkey,
    pub reward_mint: Pubkey,
    pub treasury_vault: Pubkey,
    pub reward_vault: Pubkey,
    pub reward_rate_bps: u64,
    pub staking_enabled: bool,
    pub total_staked: u64,
    pub number_of_lock_periods: u64,
    pub bump: u8,
}

impl StakingConfig {
    pub const LEN: usize = (32 * 5) + (8 * 3) + 1 + 1;
}

#[account]
pub struct LockPeriod {
    pub config: Pubkey,
    pub label: String,
    pub duration_days: u64,
    pub apy_bps: u64,
    pub min_amount: u64,
    pub early_unstake_penalty_bps: u64,
    pub early_unstake_enabled: bool,
    pub enabled: bool,
    pub bump: u8,
}

impl LockPeriod {
    pub const LEN: usize = 32 + 4 + MAX_LOCK_LABEL_LEN + 8 + 8 + 8 + 8 + 1 + 1 + 1;
}

#[account]
pub struct StakePosition {
    pub owner: Pubkey,
    pub config: Pubkey,
    pub lock_period: Pubkey,
    pub stake_mint: Pubkey,
    pub staked_amount: u64,
    pub lock_duration_days: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub reward_debt: u64,
    pub claimed_rewards: u64,
    pub unstaked: bool,
    pub position_nonce: u64,
    pub bump: u8,
}

impl StakePosition {
    pub const LEN: usize = (32 * 4) + (8 * 7) + 1 + 1;
}

#[event]
pub struct StakingConfigInitialized {
    pub admin: Pubkey,
    pub staking_mint: Pubkey,
    pub reward_mint: Pubkey,
    pub reward_rate_bps: u64,
}

#[event]
pub struct LockPeriodUpserted {
    pub config: Pubkey,
    pub label: String,
    pub duration_days: u64,
    pub apy_bps: u64,
    pub enabled: bool,
}

#[event]
pub struct StakePositionCreated {
    pub owner: Pubkey,
    pub position: Pubkey,
    pub amount: u64,
    pub duration_days: u64,
    pub start_time: i64,
    pub end_time: i64,
}

#[event]
pub struct RewardsClaimed {
    pub owner: Pubkey,
    pub position: Pubkey,
    pub amount: u64,
}

#[event]
pub struct StakePositionClosed {
    pub owner: Pubkey,
    pub position: Pubkey,
    pub principal_returned: u64,
    pub reward_paid: u64,
}

#[event]
pub struct ProtocolPauseStateChanged {
    pub admin: Pubkey,
    pub paused: bool,
}

#[error_code]
pub enum StakingError {
    #[msg("Staking is currently paused.")]
    StakingPaused,
    #[msg("The selected lock period is disabled.")]
    LockPeriodDisabled,
    #[msg("The lock duration is invalid.")]
    InvalidLockDuration,
    #[msg("The lock label is invalid.")]
    InvalidLockLabel,
    #[msg("Stake amount must be greater than zero.")]
    InvalidAmount,
    #[msg("Stake amount is below the minimum configured amount.")]
    BelowMinimumStake,
    #[msg("Rewards are not available yet.")]
    NoRewardsAvailable,
    #[msg("Stake is still locked.")]
    StakeStillLocked,
    #[msg("This position has already been unstaked.")]
    AlreadyUnstaked,
    #[msg("Overflow detected while processing rewards.")]
    MathOverflow,
}

fn claimable_rewards(position: &StakePosition, lock_period: &LockPeriod) -> Result<u64> {
    let now = Clock::get()?.unix_timestamp;
    let reward_cutoff = now.min(position.end_time);
    let elapsed_seconds = reward_cutoff.saturating_sub(position.start_time) as i128;
    let total_accrued = (position.staked_amount as i128)
        .checked_mul(lock_period.apy_bps as i128)
        .and_then(|value| value.checked_mul(elapsed_seconds))
        .and_then(|value| value.checked_div(10_000))
        .and_then(|value| value.checked_div(SECONDS_PER_YEAR))
        .ok_or(StakingError::MathOverflow)?;

    let total_accrued_u64 = u64::try_from(total_accrued).map_err(|_| StakingError::MathOverflow)?;
    total_accrued_u64
        .checked_sub(position.claimed_rewards)
        .ok_or(StakingError::MathOverflow.into())
}

fn apply_penalty(amount: u64, penalty_bps: u64) -> Result<u64> {
    let penalty = (amount as u128)
        .checked_mul(penalty_bps as u128)
        .and_then(|value| value.checked_div(10_000))
        .ok_or(StakingError::MathOverflow)?;
    amount
        .checked_sub(u64::try_from(penalty).map_err(|_| StakingError::MathOverflow)?)
        .ok_or(StakingError::MathOverflow.into())
}
