use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("HPvxx9GvKzBqBPDSrxALtnwnEhY52mnV9aNM6XPisuCh");

#[program]
pub mod lending_program {
    use super::*;

    pub fn initialize_lending_market(
        ctx: Context<InitializeLendingMarket>,
        collateral_factor_bps: u64,
        liquidation_threshold_bps: u64,
        borrow_interest_bps: u64,
        protocol_fee_bps: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.admin = ctx.accounts.admin.key();
        market.collateral_mint = ctx.accounts.collateral_mint.key();
        market.borrow_mint = ctx.accounts.borrow_mint.key();
        market.collateral_vault = ctx.accounts.collateral_vault.key();
        market.liquidity_vault = ctx.accounts.liquidity_vault.key();
        market.collateral_factor_bps = collateral_factor_bps;
        market.liquidation_threshold_bps = liquidation_threshold_bps;
        market.borrow_interest_bps = borrow_interest_bps;
        market.protocol_fee_bps = protocol_fee_bps;
        market.paused = false;
        market.bump = ctx.bumps.market;
        Ok(())
    }

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
        require!(!ctx.accounts.market.paused, LendingError::MarketPaused);
        require!(amount > 0, LendingError::InvalidAmount);

        token::transfer(ctx.accounts.transfer_collateral_context(), amount)?;

        let position = &mut ctx.accounts.position;
        position.owner = ctx.accounts.owner.key();
        position.market = ctx.accounts.market.key();
        position.collateral_deposited = position
            .collateral_deposited
            .checked_add(amount)
            .ok_or(LendingError::MathOverflow)?;
        position.health_factor_snapshot = compute_health_factor(
            position.collateral_deposited,
            position.borrowed_amount,
            ctx.accounts.market.collateral_factor_bps,
        )?;
        position.bump = ctx.bumps.position;

        emit!(CollateralDeposited {
            owner: ctx.accounts.owner.key(),
            market: ctx.accounts.market.key(),
            amount,
        });

        Ok(())
    }

    pub fn borrow_tokens(ctx: Context<BorrowTokens>, amount: u64) -> Result<()> {
        require!(!ctx.accounts.market.paused, LendingError::MarketPaused);
        require!(amount > 0, LendingError::InvalidAmount);

        let position = &mut ctx.accounts.position;
        let next_borrow = position
            .borrowed_amount
            .checked_add(amount)
            .ok_or(LendingError::MathOverflow)?;
        let max_borrow = max_borrowable(position.collateral_deposited, ctx.accounts.market.collateral_factor_bps)?;
        require!(next_borrow <= max_borrow, LendingError::InsufficientCollateral);

        let market_bump = [ctx.accounts.market.bump];
        let signer_seed_slice: &[&[u8]] = &[
            b"market",
            ctx.accounts.market.collateral_mint.as_ref(),
            ctx.accounts.market.borrow_mint.as_ref(),
            &market_bump,
        ];
        let signer_seeds: &[&[&[u8]]] = &[signer_seed_slice];
        let borrow_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.liquidity_vault.to_account_info(),
                to: ctx.accounts.user_borrow_account.to_account_info(),
                authority: ctx.accounts.market.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(borrow_ctx, amount)?;

        position.borrowed_amount = next_borrow;
        position.interest_debt = accrue_interest(next_borrow, ctx.accounts.market.borrow_interest_bps)?;
        position.health_factor_snapshot = compute_health_factor(
            position.collateral_deposited,
            position.borrowed_amount,
            ctx.accounts.market.collateral_factor_bps,
        )?;

        emit!(BorrowExecuted {
            owner: ctx.accounts.owner.key(),
            market: ctx.accounts.market.key(),
            amount,
        });

        Ok(())
    }

    pub fn repay_tokens(ctx: Context<RepayTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, LendingError::InvalidAmount);
        let current_borrowed = ctx.accounts.position.borrowed_amount;
        let collateral_deposited = ctx.accounts.position.collateral_deposited;
        require!(current_borrowed > 0, LendingError::NothingToRepay);

        let repay_amount = amount.min(current_borrowed);
        token::transfer(ctx.accounts.transfer_repay_context(), repay_amount)?;

        let position = &mut ctx.accounts.position;
        position.borrowed_amount = position
            .borrowed_amount
            .checked_sub(repay_amount)
            .ok_or(LendingError::MathOverflow)?;
        position.interest_debt = accrue_interest(position.borrowed_amount, ctx.accounts.market.borrow_interest_bps)?;
        position.health_factor_snapshot = compute_health_factor(
            collateral_deposited,
            position.borrowed_amount,
            ctx.accounts.market.collateral_factor_bps,
        )?;

        emit!(RepaymentProcessed {
            owner: ctx.accounts.owner.key(),
            market: ctx.accounts.market.key(),
            amount: repay_amount,
        });

        Ok(())
    }

    pub fn withdraw_collateral(ctx: Context<WithdrawCollateral>, amount: u64) -> Result<()> {
        require!(amount > 0, LendingError::InvalidAmount);

        let position = &mut ctx.accounts.position;
        require!(position.collateral_deposited >= amount, LendingError::InsufficientCollateral);
        let remaining = position
            .collateral_deposited
            .checked_sub(amount)
            .ok_or(LendingError::MathOverflow)?;
        let max_borrow_after = max_borrowable(remaining, ctx.accounts.market.collateral_factor_bps)?;
        require!(position.borrowed_amount <= max_borrow_after, LendingError::WithdrawalWouldLiquidate);

        let market_bump = [ctx.accounts.market.bump];
        let signer_seed_slice: &[&[u8]] = &[
            b"market",
            ctx.accounts.market.collateral_mint.as_ref(),
            ctx.accounts.market.borrow_mint.as_ref(),
            &market_bump,
        ];
        let signer_seeds: &[&[&[u8]]] = &[signer_seed_slice];
        let withdraw_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.collateral_vault.to_account_info(),
                to: ctx.accounts.user_collateral_account.to_account_info(),
                authority: ctx.accounts.market.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(withdraw_ctx, amount)?;

        position.collateral_deposited = remaining;
        position.health_factor_snapshot = compute_health_factor(
            position.collateral_deposited,
            position.borrowed_amount,
            ctx.accounts.market.collateral_factor_bps,
        )?;

        emit!(CollateralWithdrawn {
            owner: ctx.accounts.owner.key(),
            market: ctx.accounts.market.key(),
            amount,
        });

        Ok(())
    }

    pub fn liquidate_position(ctx: Context<LiquidatePosition>, repay_amount: u64) -> Result<()> {
        require!(repay_amount > 0, LendingError::InvalidAmount);
        let collateral_deposited = ctx.accounts.position.collateral_deposited;
        let borrowed_amount = ctx.accounts.position.borrowed_amount;
        let health_factor = compute_health_factor(
            collateral_deposited,
            borrowed_amount,
            ctx.accounts.market.collateral_factor_bps,
        )?;
        require!(
            health_factor * 100 < ctx.accounts.market.liquidation_threshold_bps,
            LendingError::PositionHealthy
        );

        let actual_repay = repay_amount.min(borrowed_amount);
        token::transfer(ctx.accounts.transfer_liquidation_repay_context(), actual_repay)?;

        let collateral_seized = actual_repay.min(collateral_deposited);
        let market_bump = [ctx.accounts.market.bump];
        let signer_seed_slice: &[&[u8]] = &[
            b"market",
            ctx.accounts.market.collateral_mint.as_ref(),
            ctx.accounts.market.borrow_mint.as_ref(),
            &market_bump,
        ];
        let signer_seeds: &[&[&[u8]]] = &[signer_seed_slice];
        let collateral_to_liquidator_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.collateral_vault.to_account_info(),
                to: ctx.accounts.liquidator_collateral_account.to_account_info(),
                authority: ctx.accounts.market.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(collateral_to_liquidator_ctx, collateral_seized)?;

        let position = &mut ctx.accounts.position;
        position.borrowed_amount = position
            .borrowed_amount
            .checked_sub(actual_repay)
            .ok_or(LendingError::MathOverflow)?;
        position.collateral_deposited = position
            .collateral_deposited
            .checked_sub(collateral_seized)
            .ok_or(LendingError::MathOverflow)?;
        position.health_factor_snapshot = compute_health_factor(
            position.collateral_deposited,
            position.borrowed_amount,
            ctx.accounts.market.collateral_factor_bps,
        )?;

        Ok(())
    }

    pub fn update_market_params(
        ctx: Context<UpdateMarketParams>,
        collateral_factor_bps: u64,
        liquidation_threshold_bps: u64,
        borrow_interest_bps: u64,
        protocol_fee_bps: u64,
        paused: bool,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.collateral_factor_bps = collateral_factor_bps;
        market.liquidation_threshold_bps = liquidation_threshold_bps;
        market.borrow_interest_bps = borrow_interest_bps;
        market.protocol_fee_bps = protocol_fee_bps;
        market.paused = paused;
        Ok(())
    }

    pub fn pause_market(ctx: Context<UpdateMarketParams>) -> Result<()> {
        ctx.accounts.market.paused = true;
        Ok(())
    }

    pub fn resume_market(ctx: Context<UpdateMarketParams>) -> Result<()> {
        ctx.accounts.market.paused = false;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeLendingMarket<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + LendingMarketConfig::LEN,
        seeds = [b"market", collateral_mint.key().as_ref(), borrow_mint.key().as_ref()],
        bump
    )]
    pub market: Account<'info, LendingMarketConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub collateral_mint: Account<'info, Mint>,
    pub borrow_mint: Account<'info, Mint>,
    #[account(mut, constraint = collateral_vault.mint == collateral_mint.key())]
    pub collateral_vault: Account<'info, TokenAccount>,
    #[account(mut, constraint = liquidity_vault.mint == borrow_mint.key())]
    pub liquidity_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    #[account(mut, seeds = [b"market", market.collateral_mint.as_ref(), market.borrow_mint.as_ref()], bump = market.bump)]
    pub market: Account<'info, LendingMarketConfig>,
    #[account(
        init,
        payer = owner,
        space = 8 + UserLendingPosition::LEN,
        seeds = [b"lending-position", market.key().as_ref(), owner.key().as_ref()],
        bump
    )]
    pub position: Account<'info, UserLendingPosition>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, constraint = user_collateral_account.owner == owner.key(), constraint = user_collateral_account.mint == market.collateral_mint)]
    pub user_collateral_account: Account<'info, TokenAccount>,
    #[account(mut, address = market.collateral_vault)]
    pub collateral_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BorrowTokens<'info> {
    #[account(mut, seeds = [b"market", market.collateral_mint.as_ref(), market.borrow_mint.as_ref()], bump = market.bump)]
    pub market: Account<'info, LendingMarketConfig>,
    #[account(mut, seeds = [b"lending-position", market.key().as_ref(), owner.key().as_ref()], bump = position.bump, has_one = owner)]
    pub position: Account<'info, UserLendingPosition>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, constraint = user_borrow_account.owner == owner.key(), constraint = user_borrow_account.mint == market.borrow_mint)]
    pub user_borrow_account: Account<'info, TokenAccount>,
    #[account(mut, address = market.liquidity_vault)]
    pub liquidity_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RepayTokens<'info> {
    #[account(mut, seeds = [b"market", market.collateral_mint.as_ref(), market.borrow_mint.as_ref()], bump = market.bump)]
    pub market: Account<'info, LendingMarketConfig>,
    #[account(mut, seeds = [b"lending-position", market.key().as_ref(), owner.key().as_ref()], bump = position.bump, has_one = owner)]
    pub position: Account<'info, UserLendingPosition>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, constraint = user_borrow_account.owner == owner.key(), constraint = user_borrow_account.mint == market.borrow_mint)]
    pub user_borrow_account: Account<'info, TokenAccount>,
    #[account(mut, address = market.liquidity_vault)]
    pub liquidity_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawCollateral<'info> {
    #[account(mut, seeds = [b"market", market.collateral_mint.as_ref(), market.borrow_mint.as_ref()], bump = market.bump)]
    pub market: Account<'info, LendingMarketConfig>,
    #[account(mut, seeds = [b"lending-position", market.key().as_ref(), owner.key().as_ref()], bump = position.bump, has_one = owner)]
    pub position: Account<'info, UserLendingPosition>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, constraint = user_collateral_account.owner == owner.key(), constraint = user_collateral_account.mint == market.collateral_mint)]
    pub user_collateral_account: Account<'info, TokenAccount>,
    #[account(mut, address = market.collateral_vault)]
    pub collateral_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct LiquidatePosition<'info> {
    #[account(mut, seeds = [b"market", market.collateral_mint.as_ref(), market.borrow_mint.as_ref()], bump = market.bump)]
    pub market: Account<'info, LendingMarketConfig>,
    #[account(mut)]
    pub liquidator: Signer<'info>,
    #[account(mut)]
    pub owner: SystemAccount<'info>,
    #[account(mut, seeds = [b"lending-position", market.key().as_ref(), owner.key().as_ref()], bump = position.bump)]
    pub position: Account<'info, UserLendingPosition>,
    #[account(mut, constraint = liquidator_repay_account.owner == liquidator.key(), constraint = liquidator_repay_account.mint == market.borrow_mint)]
    pub liquidator_repay_account: Account<'info, TokenAccount>,
    #[account(mut, constraint = liquidator_collateral_account.owner == liquidator.key(), constraint = liquidator_collateral_account.mint == market.collateral_mint)]
    pub liquidator_collateral_account: Account<'info, TokenAccount>,
    #[account(mut, address = market.liquidity_vault)]
    pub liquidity_vault: Account<'info, TokenAccount>,
    #[account(mut, address = market.collateral_vault)]
    pub collateral_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateMarketParams<'info> {
    #[account(mut, has_one = admin, seeds = [b"market", market.collateral_mint.as_ref(), market.borrow_mint.as_ref()], bump = market.bump)]
    pub market: Account<'info, LendingMarketConfig>,
    pub admin: Signer<'info>,
}

impl<'info> DepositCollateral<'info> {
    fn transfer_collateral_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(self.token_program.to_account_info(), Transfer {
            from: self.user_collateral_account.to_account_info(),
            to: self.collateral_vault.to_account_info(),
            authority: self.owner.to_account_info(),
        })
    }
}

impl<'info> RepayTokens<'info> {
    fn transfer_repay_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(self.token_program.to_account_info(), Transfer {
            from: self.user_borrow_account.to_account_info(),
            to: self.liquidity_vault.to_account_info(),
            authority: self.owner.to_account_info(),
        })
    }
}

impl<'info> LiquidatePosition<'info> {
    fn transfer_liquidation_repay_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(self.token_program.to_account_info(), Transfer {
            from: self.liquidator_repay_account.to_account_info(),
            to: self.liquidity_vault.to_account_info(),
            authority: self.liquidator.to_account_info(),
        })
    }
}

#[account]
pub struct LendingMarketConfig {
    pub admin: Pubkey,
    pub collateral_mint: Pubkey,
    pub borrow_mint: Pubkey,
    pub collateral_vault: Pubkey,
    pub liquidity_vault: Pubkey,
    pub collateral_factor_bps: u64,
    pub liquidation_threshold_bps: u64,
    pub borrow_interest_bps: u64,
    pub protocol_fee_bps: u64,
    pub paused: bool,
    pub bump: u8,
}

impl LendingMarketConfig {
    pub const LEN: usize = (32 * 5) + (8 * 4) + 1 + 1;
}

#[account]
pub struct UserLendingPosition {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub collateral_deposited: u64,
    pub borrowed_amount: u64,
    pub interest_debt: u64,
    pub health_factor_snapshot: u64,
    pub bump: u8,
}

impl UserLendingPosition {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 8 + 8 + 1;
}

#[event]
pub struct CollateralDeposited {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub amount: u64,
}

#[event]
pub struct BorrowExecuted {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RepaymentProcessed {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub amount: u64,
}

#[event]
pub struct CollateralWithdrawn {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum LendingError {
    #[msg("The lending market is paused.")]
    MarketPaused,
    #[msg("Amount must be greater than zero.")]
    InvalidAmount,
    #[msg("Position does not have enough collateral.")]
    InsufficientCollateral,
    #[msg("There is no debt to repay.")]
    NothingToRepay,
    #[msg("This withdrawal would liquidate the account.")]
    WithdrawalWouldLiquidate,
    #[msg("Position is healthy and cannot be liquidated.")]
    PositionHealthy,
    #[msg("Arithmetic overflow detected.")]
    MathOverflow,
}

fn max_borrowable(collateral: u64, collateral_factor_bps: u64) -> Result<u64> {
    u64::try_from(
        (collateral as u128)
            .checked_mul(collateral_factor_bps as u128)
            .and_then(|value| value.checked_div(10_000))
            .ok_or(LendingError::MathOverflow)?,
    )
    .map_err(|_| LendingError::MathOverflow.into())
}

fn compute_health_factor(collateral: u64, borrow: u64, collateral_factor_bps: u64) -> Result<u64> {
    if borrow == 0 {
        return Ok(10_000);
    }

    u64::try_from(
        (collateral as u128)
            .checked_mul(collateral_factor_bps as u128)
            .and_then(|value| value.checked_mul(100))
            .and_then(|value| value.checked_div((borrow as u128) * 10_000))
            .ok_or(LendingError::MathOverflow)?,
    )
    .map_err(|_| LendingError::MathOverflow.into())
}

fn accrue_interest(borrow_amount: u64, interest_bps: u64) -> Result<u64> {
    u64::try_from(
        (borrow_amount as u128)
            .checked_mul(interest_bps as u128)
            .and_then(|value| value.checked_div(10_000))
            .ok_or(LendingError::MathOverflow)?,
    )
    .map_err(|_| LendingError::MathOverflow.into())
}
