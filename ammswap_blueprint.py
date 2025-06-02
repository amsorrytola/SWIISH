# Standard and related third parties
from math import ceil
from typing import Optional, TypeAlias

# Hathor (local application/library)
from hathor.nanocontracts.blueprint import Blueprint
from hathor.nanocontracts.context import Context
from hathor.nanocontracts.exception import NCFail
from hathor.nanocontracts.types import (
    Address,
    Amount,
    NCActionType,
    public,
    view,
    TokenUid,
)

Amount: TypeAlias = int


class SWIISH(Blueprint):
    """
    Liquidity pool blueprint for SWIISH.
    """

    # — State fields —
    owner: Address

    token_a: TokenUid
    token_b: TokenUid

    token_iswiish: TokenUid
    token_uswiish: TokenUid

    nft_i_enterDao: TokenUid
    nft_i_experiencemember: TokenUid
    nft_i_supermember: TokenUid
    nft_i_legendary: TokenUid
    nft_i_ultimate: TokenUid

    nft_u_enterDao: TokenUid
    nft_u_experiencemember: TokenUid
    nft_u_supermember: TokenUid
    nft_u_legendary: TokenUid
    nft_u_ultimate: TokenUid

    token_htr: TokenUid

    swap_reserve: dict[TokenUid, Amount]
    swiish_reserve: dict[TokenUid, Amount]
    nft_reserve: dict[TokenUid, Amount]
    htr_reserve: Amount

    iswiish_holding: dict[Address, Amount]
    uswiish_holding: dict[Address, Amount]
    nft_holding: dict[Address, TokenUid]
    htr_withdrawable: dict[Address, Amount]

    swaps_counter: int

    @public
    def initialize(self, ctx: Context, token_a: TokenUid, token_b: TokenUid, token_iswiish: TokenUid, token_uswiish: TokenUid, token_htr: TokenUid, nft_i_enterDao: TokenUid, nft_i_experiencemember: TokenUid, nft_i_supermember: TokenUid, nft_i_legendary: TokenUid, nft_i_ultimate: TokenUid, nft_u_enterDao: TokenUid, nft_u_experiencemember: TokenUid, nft_u_supermember: TokenUid, nft_u_legendary: TokenUid, nft_u_ultimate: TokenUid) -> None:
        """
        Initialize the liquidity pool with two tokens.
        """
        self.token_a = token_a
        self.token_b = token_b
        self.token_iswiish = token_iswiish
        self.token_uswiish = token_uswiish
        self.token_htr = token_htr
        self.nft_i_enterDao = nft_i_enterDao
        self.nft_i_experiencemember = nft_i_experiencemember
        self.nft_i_supermember = nft_i_supermember
        self.nft_i_legendary = nft_i_legendary
        self.nft_i_ultimate = nft_i_ultimate
        self.nft_u_enterDao = nft_u_enterDao
        self.nft_u_experiencemember = nft_u_experiencemember
        self.nft_u_supermember = nft_u_supermember
        self.nft_u_legendary = nft_u_legendary
        self.nft_u_ultimate = nft_u_ultimate
        self.nft_reserve[nft_i_enterDao] = 0
        self.nft_reserve[nft_i_experiencemember] = 0
        self.nft_reserve[nft_i_supermember] = 0
        self.nft_reserve[nft_i_legendary] = 0
        self.nft_reserve[nft_i_ultimate] = 0
        self.nft_reserve[nft_u_enterDao] = 0
        self.nft_reserve[nft_u_experiencemember] = 0
        self.nft_reserve[nft_u_supermember] = 0
        self.nft_reserve[nft_u_legendary] = 0
        self.nft_reserve[nft_u_ultimate] = 0
        self.swap_reserve[token_a] = 0
        self.swap_reserve[token_b] = 0
        self.swiish_reserve[token_iswiish] = 0
        self.swiish_reserve[token_uswiish] = 0
        self.htr_reserve = 0
        self.owner = Address(ctx.address)

    @public
    def add_liquidity(self, ctx: Context, token: TokenUid) -> None:
        """
        Add liquidity of a single token (token_a or token_b).
        User must deposit `token` and withdraw the exact amount of iSWIISH reward.
        """
        action = ctx.actions[token]
        amount = action.amount
        addr = Address(ctx.address)

        if action.type != NCActionType.DEPOSIT:
            raise NCFail("Must be deposit")

        if token not in self.swap_reserve:
            raise NCFail(f"Token {token.hex()} not in pool")

        if amount <= 0:
            raise NCFail("Amount must be > 0")

        # Determine iSWIISH reward and verify user withdraws it
        user_reward_action = ctx.actions[self.token_iswiish]
        if user_reward_action is None:
            raise NCFail("Missing iSWIISH reward withdrawal")

        reward_amount = self._calculate_swiish_reward(amount, token)
        if user_reward_action.type != NCActionType.WITHDRAWAL:
            raise NCFail("Must withdraw iSWIISH for reward")

        if reward_amount != user_reward_action.amount:
            raise NCFail(f"iSWIISH reward must be {reward_amount}, got {user_reward_action.amount}")

        if self.swiish_reserve[self.token_iswiish] < reward_amount:
            raise NCFail("Not enough iSWIISH liquidity")

        # Update reserves and user holdings
        self.swap_reserve[token] += amount
        self.swiish_reserve[self.token_iswiish] -= reward_amount
        self.iswiish_holding[addr] = self.iswiish_holding.get(addr, 0) + reward_amount

        # If user holds no iSWIISH before, set withdrawable = reward_amount
        self.htr_withdrawable.setdefault(addr, 0)

    @public
    def add_swiish_liquidity(self, ctx: Context, token: TokenUid) -> None:
        """
        Deposit iSWIISH or uSWIISH into the blueprint’s SWIISH reserve.
        """
        action = ctx.actions[token]
        amount = action.amount

        if action.type != NCActionType.DEPOSIT:
            raise NCFail("Must be deposit")

        if token not in self.swiish_reserve:
            raise NCFail(f"Token {token.hex()} not in SWIISH reserve")

        if amount <= 0:
            raise NCFail("Amount must be > 0")

        self.swiish_reserve[token] += amount

    @public
    def swap(self, ctx: Context) -> None:
        """
        Swap between token_a and token_b.
        Requires three actions:
          - Deposit `token_in`
          - Withdraw `token_out`
          - Deposit HTR fee
          - Withdraw 1 uSWIISH as reward
        """
        if len(ctx.actions) != 4:
            raise NCFail("Swap needs exactly 4 actions")

        # Partition actions
        deposits = [a for a in ctx.actions.values() if a.type == NCActionType.DEPOSIT]
        withdrawals = [a for a in ctx.actions.values() if a.type == NCActionType.WITHDRAWAL]

        # Expect exactly 2 deposits (one token_in + HTR fee) and 2 withdrawals (one token_out + 1 uSWIISH)
        if len(deposits) != 2 or len(withdrawals) != 2:
            raise NCFail("Invalid swap actions")

        # Identify token_in and fee
        in_act = next(a for a in deposits if a.token_uid in (self.token_a, self.token_b))
        fee_act = next(a for a in deposits if a.token_uid == self.token_htr)
        out_token_act = next(a for a in withdrawals if a.token_uid in (self.token_a, self.token_b))
        reward_act = next(a for a in withdrawals if a.token_uid == self.token_uswiish)

        # Compute expected amounts
        token_out, expected_out_amt, expected_fee = self.get_swap_quote(in_act.token_uid, in_act.amount)

        if out_token_act.token_uid != token_out:
            raise NCFail("Incorrect token_out")

        if out_token_act.amount != expected_out_amt:
            raise NCFail(f"Expected {expected_out_amt} of {token_out.hex()}, got {out_token_act.amount}")

        if fee_act.amount < expected_fee:
            raise NCFail(f"Expected HTR fee ≥ {expected_fee}, got {fee_act.amount}")

        if reward_act.type != NCActionType.WITHDRAWAL or reward_act.amount != 1:
            raise NCFail("Must withdraw exactly 1 uSWIISH as reward")

        if self.swiish_reserve[self.token_uswiish] < 1:
            raise NCFail("No uSWIISH left for reward")

        # Update reserves
        self.swap_reserve[in_act.token_uid] += in_act.amount
        self.swap_reserve[token_out] -= expected_out_amt
        self.htr_reserve += expected_fee

        # Reward 1 uSWIISH
        self.swiish_reserve[self.token_uswiish] -= 1
        addr = Address(ctx.address)
        self.uswiish_holding[addr] = self.uswiish_holding.get(addr, 0) + 1

        self.swaps_counter += 1

    @public
    def add_nft_liquidity(self, ctx: Context, token: TokenUid) -> None:
        """
        Deposit a specific NFT into the pool’s NFT reserve.
        """
        action = ctx.actions[token]
        amount = action.amount

        if action.type != NCActionType.DEPOSIT:
            raise NCFail("Must be deposit")

        if token not in self.nft_reserve:
            raise NCFail(f"NFT {token.hex()} not in pool")

        if amount <= 0:
            raise NCFail("Amount must be > 0")

        self.nft_reserve[token] += amount

    @public
    def claim_nft(self, ctx: Context) -> None:
        """
        Claim exactly one NFT, if eligible.
        """
        action = self._get_action(ctx)
        nft_uid = action.token_uid
        amount = action.amount
        addr = Address(ctx.address)

        if amount != 1:
            raise NCFail("Amount must be 1")

        if action.type != NCActionType.WITHDRAWAL:
            raise NCFail("Must be withdrawal")

        if nft_uid not in self.nft_reserve:
            raise NCFail(f"NFT {nft_uid.hex()} not in pool")

        if self.nft_reserve[nft_uid] <= 0:
            raise NCFail("No NFT liquidity")

        if not self.check_nft_eligibility(addr, nft_uid):
            raise NCFail("Not eligible for this NFT")

        self.nft_reserve[nft_uid] -= 1
        self.nft_holding[addr] = nft_uid  # Overwrite if already held

    @public
    def distribute_htr(self, ctx: Context) -> None:
        """
        Distribute the entire htr_reserve:
          - 5% to owner
          - 95% to iSWIISH holders pro-rata
        Only owner or investor holding ≥ 'nft_i_experiencemember' may call.
        """
        caller = Address(ctx.address)

        # Authorization
        if caller != self.owner:
            inv_nft = self.nft_holding.get(caller)
            if inv_nft not in (
                self.nft_i_experiencemember,
                self.nft_i_supermember,
                self.nft_i_legendary,
                self.nft_i_ultimate,
            ):
                raise NCFail("Not authorized to distribute HTR fees")

        total_htr = self.htr_reserve
        if total_htr <= 0:
            raise NCFail("No HTR to distribute")

        # Owner’s 5%
        owner_share = (total_htr * 5) // 100
        investor_pool = total_htr - owner_share

        # Credit owner
        self.htr_withdrawable[self.owner] = (
            self.htr_withdrawable.get(self.owner, 0) + owner_share
        )

        # Sum all iSWIISH holdings
        total_iswiish = sum(self.iswiish_holding.values())

        distributed = 0
        if total_iswiish > 0:
            for addr, held_amt in self.iswiish_holding.items():
                if held_amt > 0:
                    share = (held_amt * investor_pool) // total_iswiish
                    if share > 0:
                        self.htr_withdrawable[addr] = (
                            self.htr_withdrawable.get(addr, 0) + share
                        )
                        distributed += share

        # Any remainder stays in htr_reserve
        leftover = investor_pool - distributed
        self.htr_reserve = leftover

    @public
    def withdraw_available_htr(self, ctx: Context) -> None:
        """
        Withdraw all HTR available to the caller into their address.
        """
        caller = Address(ctx.address)
        available = self.htr_withdrawable.get(caller, 0)
        if available <= 0:
            raise NCFail("No HTR to withdraw")

        # Zero out first
        self.htr_withdrawable[caller] = 0

        # Actual UTXO withdrawal must be emitted here, e.g.:
        # ctx.withdraw(self.token_htr, available)
        pass

    @public
    def _get_action(self, ctx: Context) -> NCActionType:
        """
        Return the only NCAction in ctx.actions; fail if more or token mismatch.
        """
        if len(ctx.actions) != 1:
            raise NCFail("Only one action supported")
        token_uid, action = next(iter(ctx.actions.items()))
        return action

    @public
    def get_reserves(self, ctx: Context) -> dict[TokenUid, Amount]:
        """Return the swap reserves {token_a: amt, token_b: amt}."""
        return dict(self.swap_reserve)

    @public
    def get_swiish_reserves(self, ctx: Context) -> dict[TokenUid, Amount]:
        """Return the SWIISH reserves {iSWIISH: amt, uSWIISH: amt}."""
        return dict(self.swiish_reserve)

    @public
    def check_nft_eligibility(self, addr: Address, nft: TokenUid) -> bool:
        """
        Check if `addr` is eligible for `nft` based on SWIISH holdings.
        """
        held_i = self.iswiish_holding.get(addr, 0)
        held_u = self.uswiish_holding.get(addr, 0)

        # Investor‐DAO tiers
        if nft == self.nft_i_enterDao and held_i >= 10:
            return True
        if nft == self.nft_i_experiencemember and held_i >= 50:
            return True
        if nft == self.nft_i_supermember and held_i >= 200:
            return True
        if nft == self.nft_i_legendary and held_i >= 500:
            return True
        if nft == self.nft_i_ultimate and held_i >= 1000:
            return True

        # User‐DAO tiers
        if nft == self.nft_u_enterDao and held_u >= 1:
            return True
        if nft == self.nft_u_experiencemember and held_u >= 5:
            return True
        if nft == self.nft_u_supermember and held_u >= 20:
            return True
        if nft == self.nft_u_legendary and held_u >= 50:
            return True
        if nft == self.nft_u_ultimate and held_u >= 100:
            return True

        return False

    @public
    def _calculate_swiish_reward(self, amount: Amount, token: TokenUid) -> Amount:
        """
        Reward iSWIISH based on L²P: if pool holds fewer of 'token' than its pair,
        reward more iSWIISH. Formula: 
          if total_liq = swap_reserve[a] + swap_reserve[b],
             ratio = swap_reserve[token]/total_liq,
             reward = ceil(amount * (1 - ratio) * 10).
          If pool is empty, reward a flat 10.
        """
        total_liq = self.swap_reserve[self.token_a] + self.swap_reserve[self.token_b]
        if total_liq == 0:
            return 10

        ratio = self.swap_reserve[token] / total_liq
        raw_reward = amount * (1 - ratio) * 10
        return ceil(raw_reward)
            

# Exception classes
class TooManyActions(NCFail):
    pass


class InvalidToken(NCFail):
    pass


class WithdrawalNotAllowed(NCFail):
    pass


class AmountNotMatched(NCFail):
    pass


class DepositNotAllowed(NCFail):
    pass


class NotEnoughLiquidity(NCFail):
    pass


class InvalidEligibility(NCFail):
    pass


__blueprint__ = SWIISH
