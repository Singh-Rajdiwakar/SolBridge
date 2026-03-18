use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("9bGvKgjuKiuXrr6C4yGyzn9yGn4GSoGUdBEmMjssUzCu");

#[program]
pub mod liquidity_program {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>, fee_rate_bps: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.admin = ctx.accounts.admin.key();
        pool.token_a_mint = ctx.accounts.token_a_mint.key();
        pool.token_b_mint = ctx.accounts.token_b_mint.key();
        pool.reserve_a_vault = ctx.accounts.reserve_a_vault.key();
        pool.reserve_b_vault = ctx.accounts.reserve_b_vault.key();
        pool.lp_mint = ctx.accounts.lp_mint.key();
        pool.fee_rate_bps = fee_rate_bps;
        pool.total_liquidity = 0;
        pool.paused = false;
        pool.bump = ctx.bumps.pool;

        emit!(PoolInitialized {
            pool: pool.key(),
            token_a_mint: pool.token_a_mint,
            token_b_mint: pool.token_b_mint,
            fee_rate_bps,
        });

        Ok(())
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_a: u64,
        amount_b: u64,
        min_lp_out: u64,
    ) -> Result<()> {
        require!(!ctx.accounts.pool.paused, LiquidityError::PoolPaused);
        require!(amount_a > 0 && amount_b > 0, LiquidityError::InvalidAmount);

        let reserve_a = ctx.accounts.reserve_a_vault.amount;
        let reserve_b = ctx.accounts.reserve_b_vault.amount;
        let minted_lp = calculate_lp_out(amount_a, amount_b, reserve_a, reserve_b, ctx.accounts.pool.total_liquidity)?;
        require!(minted_lp >= min_lp_out, LiquidityError::SlippageExceeded);

        token::transfer(ctx.accounts.transfer_a_context(), amount_a)?;
        token::transfer(ctx.accounts.transfer_b_context(), amount_b)?;
        let pool_bump = [ctx.accounts.pool.bump];
        let signer_seed_slice: &[&[u8]] = &[
            b"pool",
            ctx.accounts.pool.token_a_mint.as_ref(),
            ctx.accounts.pool.token_b_mint.as_ref(),
            &pool_bump,
        ];
        let signer_seeds: &[&[&[u8]]] = &[signer_seed_slice];
        let mint_lp_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.lp_mint.to_account_info(),
                to: ctx.accounts.user_lp_token.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        );
        token::mint_to(mint_lp_ctx, minted_lp)?;

        let position = &mut ctx.accounts.position;
        position.owner = ctx.accounts.owner.key();
        position.pool = ctx.accounts.pool.key();
        position.lp_token_amount = position
            .lp_token_amount
            .checked_add(minted_lp)
            .ok_or(LiquidityError::MathOverflow)?;
        position.deposited_token_a_amount = position
            .deposited_token_a_amount
            .checked_add(amount_a)
            .ok_or(LiquidityError::MathOverflow)?;
        position.deposited_token_b_amount = position
            .deposited_token_b_amount
            .checked_add(amount_b)
            .ok_or(LiquidityError::MathOverflow)?;
        position.bump = ctx.bumps.position;

        ctx.accounts.pool.total_liquidity = ctx.accounts.pool.total_liquidity
            .checked_add(minted_lp)
            .ok_or(LiquidityError::MathOverflow)?;

        emit!(LiquidityAdded {
            owner: ctx.accounts.owner.key(),
            pool: ctx.accounts.pool.key(),
            amount_a,
            amount_b,
            lp_minted: minted_lp,
        });

        Ok(())
    }

    pub fn remove_liquidity(ctx: Context<RemoveLiquidity>, lp_amount: u64) -> Result<()> {
        require!(!ctx.accounts.pool.paused, LiquidityError::PoolPaused);
        require!(lp_amount > 0, LiquidityError::InvalidAmount);
        require!(
            ctx.accounts.position.lp_token_amount >= lp_amount,
            LiquidityError::InsufficientLiquidity
        );

        let reserve_a = ctx.accounts.reserve_a_vault.amount as u128;
        let reserve_b = ctx.accounts.reserve_b_vault.amount as u128;
        let total_liquidity = ctx.accounts.pool.total_liquidity.max(1) as u128;

        let amount_a = u64::try_from(
            reserve_a
                .checked_mul(lp_amount as u128)
                .and_then(|value| value.checked_div(total_liquidity))
                .ok_or(LiquidityError::MathOverflow)?,
        )
        .map_err(|_| LiquidityError::MathOverflow)?;
        let amount_b = u64::try_from(
            reserve_b
                .checked_mul(lp_amount as u128)
                .and_then(|value| value.checked_div(total_liquidity))
                .ok_or(LiquidityError::MathOverflow)?,
        )
        .map_err(|_| LiquidityError::MathOverflow)?;

        token::burn(ctx.accounts.burn_lp_context(), lp_amount)?;
        let pool_bump = [ctx.accounts.pool.bump];
        let signer_seed_slice: &[&[u8]] = &[
            b"pool",
            ctx.accounts.pool.token_a_mint.as_ref(),
            ctx.accounts.pool.token_b_mint.as_ref(),
            &pool_bump,
        ];
        let signer_seeds: &[&[&[u8]]] = &[signer_seed_slice];
        let transfer_a_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.reserve_a_vault.to_account_info(),
                to: ctx.accounts.user_token_a.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_a_ctx, amount_a)?;
        let transfer_b_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.reserve_b_vault.to_account_info(),
                to: ctx.accounts.user_token_b.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_b_ctx, amount_b)?;

        ctx.accounts.position.lp_token_amount = ctx.accounts.position.lp_token_amount
            .checked_sub(lp_amount)
            .ok_or(LiquidityError::MathOverflow)?;
        ctx.accounts.pool.total_liquidity = ctx.accounts.pool.total_liquidity
            .checked_sub(lp_amount)
            .ok_or(LiquidityError::MathOverflow)?;

        emit!(LiquidityRemoved {
            owner: ctx.accounts.owner.key(),
            pool: ctx.accounts.pool.key(),
            amount_a,
            amount_b,
            lp_burned: lp_amount,
        });

        Ok(())
    }

    pub fn swap_exact_input(
        ctx: Context<SwapExactInput>,
        amount_in: u64,
        min_amount_out: u64,
        a_to_b: bool,
    ) -> Result<()> {
        require!(!ctx.accounts.pool.paused, LiquidityError::PoolPaused);
        require!(amount_in > 0, LiquidityError::InvalidAmount);

        let reserve_in = if a_to_b {
            ctx.accounts.reserve_a_vault.amount
        } else {
            ctx.accounts.reserve_b_vault.amount
        };
        let reserve_out = if a_to_b {
            ctx.accounts.reserve_b_vault.amount
        } else {
            ctx.accounts.reserve_a_vault.amount
        };
        let amount_out = calculate_swap_output(amount_in, reserve_in, reserve_out, ctx.accounts.pool.fee_rate_bps)?;
        require!(amount_out >= min_amount_out, LiquidityError::SlippageExceeded);

        token::transfer(ctx.accounts.transfer_swap_in_context(), amount_in)?;
        let pool_bump = [ctx.accounts.pool.bump];
        let signer_seed_slice: &[&[u8]] = &[
            b"pool",
            ctx.accounts.pool.token_a_mint.as_ref(),
            ctx.accounts.pool.token_b_mint.as_ref(),
            &pool_bump,
        ];
        let signer_seeds: &[&[&[u8]]] = &[signer_seed_slice];
        let source = if ctx.accounts.user_destination_token.mint == ctx.accounts.pool.token_b_mint {
            ctx.accounts.reserve_b_vault.to_account_info()
        } else {
            ctx.accounts.reserve_a_vault.to_account_info()
        };
        let swap_out_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: source,
                to: ctx.accounts.user_destination_token.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(swap_out_ctx, amount_out)?;

        emit!(SwapExecuted {
            owner: ctx.accounts.owner.key(),
            pool: ctx.accounts.pool.key(),
            amount_in,
            amount_out,
            a_to_b,
        });

        Ok(())
    }

    pub fn set_pool_fee(ctx: Context<UpdatePoolAdmin>, fee_rate_bps: u64) -> Result<()> {
        ctx.accounts.pool.fee_rate_bps = fee_rate_bps;
        Ok(())
    }

    pub fn pause_pool(ctx: Context<UpdatePoolAdmin>) -> Result<()> {
        ctx.accounts.pool.paused = true;
        Ok(())
    }

    pub fn resume_pool(ctx: Context<UpdatePoolAdmin>) -> Result<()> {
        ctx.accounts.pool.paused = false;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + PoolState::LEN,
        seeds = [b"pool", token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, PoolState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub token_a_mint: Account<'info, Mint>,
    pub token_b_mint: Account<'info, Mint>,
    #[account(mut, constraint = reserve_a_vault.mint == token_a_mint.key())]
    pub reserve_a_vault: Account<'info, TokenAccount>,
    #[account(mut, constraint = reserve_b_vault.mint == token_b_mint.key())]
    pub reserve_b_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut, seeds = [b"pool", pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()], bump = pool.bump)]
    pub pool: Account<'info, PoolState>,
    #[account(
        init,
        payer = owner,
        space = 8 + UserLiquidityPosition::LEN,
        seeds = [b"position", pool.key().as_ref(), owner.key().as_ref()],
        bump
    )]
    pub position: Account<'info, UserLiquidityPosition>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, constraint = user_token_a.owner == owner.key(), constraint = user_token_a.mint == pool.token_a_mint)]
    pub user_token_a: Account<'info, TokenAccount>,
    #[account(mut, constraint = user_token_b.owner == owner.key(), constraint = user_token_b.mint == pool.token_b_mint)]
    pub user_token_b: Account<'info, TokenAccount>,
    #[account(mut, constraint = user_lp_token.owner == owner.key(), constraint = user_lp_token.mint == pool.lp_mint)]
    pub user_lp_token: Account<'info, TokenAccount>,
    #[account(mut, address = pool.reserve_a_vault)]
    pub reserve_a_vault: Account<'info, TokenAccount>,
    #[account(mut, address = pool.reserve_b_vault)]
    pub reserve_b_vault: Account<'info, TokenAccount>,
    #[account(mut, address = pool.lp_mint)]
    pub lp_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(mut, seeds = [b"pool", pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()], bump = pool.bump)]
    pub pool: Account<'info, PoolState>,
    #[account(mut, seeds = [b"position", pool.key().as_ref(), owner.key().as_ref()], bump = position.bump, has_one = owner)]
    pub position: Account<'info, UserLiquidityPosition>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, constraint = user_token_a.owner == owner.key(), constraint = user_token_a.mint == pool.token_a_mint)]
    pub user_token_a: Account<'info, TokenAccount>,
    #[account(mut, constraint = user_token_b.owner == owner.key(), constraint = user_token_b.mint == pool.token_b_mint)]
    pub user_token_b: Account<'info, TokenAccount>,
    #[account(mut, constraint = user_lp_token.owner == owner.key(), constraint = user_lp_token.mint == pool.lp_mint)]
    pub user_lp_token: Account<'info, TokenAccount>,
    #[account(mut, address = pool.reserve_a_vault)]
    pub reserve_a_vault: Account<'info, TokenAccount>,
    #[account(mut, address = pool.reserve_b_vault)]
    pub reserve_b_vault: Account<'info, TokenAccount>,
    #[account(mut, address = pool.lp_mint)]
    pub lp_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SwapExactInput<'info> {
    #[account(mut, seeds = [b"pool", pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()], bump = pool.bump)]
    pub pool: Account<'info, PoolState>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub user_source_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_destination_token: Account<'info, TokenAccount>,
    #[account(mut, address = pool.reserve_a_vault)]
    pub reserve_a_vault: Account<'info, TokenAccount>,
    #[account(mut, address = pool.reserve_b_vault)]
    pub reserve_b_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdatePoolAdmin<'info> {
    #[account(mut, has_one = admin, seeds = [b"pool", pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()], bump = pool.bump)]
    pub pool: Account<'info, PoolState>,
    pub admin: Signer<'info>,
}

impl<'info> AddLiquidity<'info> {
    fn transfer_a_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(self.token_program.to_account_info(), Transfer {
            from: self.user_token_a.to_account_info(),
            to: self.reserve_a_vault.to_account_info(),
            authority: self.owner.to_account_info(),
        })
    }

    fn transfer_b_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(self.token_program.to_account_info(), Transfer {
            from: self.user_token_b.to_account_info(),
            to: self.reserve_b_vault.to_account_info(),
            authority: self.owner.to_account_info(),
        })
    }
}

impl<'info> RemoveLiquidity<'info> {
    fn burn_lp_context(&self) -> CpiContext<'_, '_, '_, 'info, Burn<'info>> {
        CpiContext::new(self.token_program.to_account_info(), Burn {
            mint: self.lp_mint.to_account_info(),
            from: self.user_lp_token.to_account_info(),
            authority: self.owner.to_account_info(),
        })
    }
}

impl<'info> SwapExactInput<'info> {
    fn transfer_swap_in_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let destination = if self.user_source_token.mint == self.pool.token_a_mint {
            self.reserve_a_vault.to_account_info()
        } else {
            self.reserve_b_vault.to_account_info()
        };
        CpiContext::new(self.token_program.to_account_info(), Transfer {
            from: self.user_source_token.to_account_info(),
            to: destination,
            authority: self.owner.to_account_info(),
        })
    }
}

#[account]
pub struct PoolState {
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub reserve_a_vault: Pubkey,
    pub reserve_b_vault: Pubkey,
    pub lp_mint: Pubkey,
    pub fee_rate_bps: u64,
    pub admin: Pubkey,
    pub total_liquidity: u64,
    pub paused: bool,
    pub bump: u8,
}

impl PoolState {
    pub const LEN: usize = (32 * 6) + 8 + 8 + 1 + 1;
}

#[account]
pub struct UserLiquidityPosition {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub lp_token_amount: u64,
    pub deposited_token_a_amount: u64,
    pub deposited_token_b_amount: u64,
    pub bump: u8,
}

impl UserLiquidityPosition {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 8 + 1;
}

#[event]
pub struct PoolInitialized {
    pub pool: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub fee_rate_bps: u64,
}

#[event]
pub struct LiquidityAdded {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub amount_a: u64,
    pub amount_b: u64,
    pub lp_minted: u64,
}

#[event]
pub struct LiquidityRemoved {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub amount_a: u64,
    pub amount_b: u64,
    pub lp_burned: u64,
}

#[event]
pub struct SwapExecuted {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub amount_in: u64,
    pub amount_out: u64,
    pub a_to_b: bool,
}

#[error_code]
pub enum LiquidityError {
    #[msg("The liquidity pool is currently paused.")]
    PoolPaused,
    #[msg("Invalid token amount.")]
    InvalidAmount,
    #[msg("Output is below the minimum required amount.")]
    SlippageExceeded,
    #[msg("Insufficient liquidity position.")]
    InsufficientLiquidity,
    #[msg("Arithmetic overflow detected.")]
    MathOverflow,
}

fn calculate_lp_out(amount_a: u64, amount_b: u64, reserve_a: u64, reserve_b: u64, total_liquidity: u64) -> Result<u64> {
    if total_liquidity == 0 || reserve_a == 0 || reserve_b == 0 {
        return Ok(amount_a.min(amount_b));
    }

    let lp_from_a = (amount_a as u128)
        .checked_mul(total_liquidity as u128)
        .and_then(|value| value.checked_div(reserve_a as u128))
        .ok_or(LiquidityError::MathOverflow)?;
    let lp_from_b = (amount_b as u128)
        .checked_mul(total_liquidity as u128)
        .and_then(|value| value.checked_div(reserve_b as u128))
        .ok_or(LiquidityError::MathOverflow)?;

    u64::try_from(lp_from_a.min(lp_from_b)).map_err(|_| LiquidityError::MathOverflow.into())
}

fn calculate_swap_output(amount_in: u64, reserve_in: u64, reserve_out: u64, fee_rate_bps: u64) -> Result<u64> {
    let amount_in_after_fee = (amount_in as u128)
        .checked_mul((10_000_u64.checked_sub(fee_rate_bps).ok_or(LiquidityError::MathOverflow)?) as u128)
        .and_then(|value| value.checked_div(10_000))
        .ok_or(LiquidityError::MathOverflow)?;
    let numerator = amount_in_after_fee
        .checked_mul(reserve_out as u128)
        .ok_or(LiquidityError::MathOverflow)?;
    let denominator = (reserve_in as u128)
        .checked_add(amount_in_after_fee)
        .ok_or(LiquidityError::MathOverflow)?;

    u64::try_from(numerator.checked_div(denominator).ok_or(LiquidityError::MathOverflow)?)
        .map_err(|_| LiquidityError::MathOverflow.into())
}
