# SWIISH 

SWIISH is an on-chain liquidity pool that lets users deposit two arbitrary tokens (Token A and Token B) into a constant-product AMM. Liquidity providers earn **iSWIISH** tokens as a reward. Traders can swap between Token A and Token B, paying a small HTR fee, and receive **uSWIISH** tokens for each swap. The contract also supports minting and claiming NFTs (two parallel DAO systems: Investor DAO & User DAO) based on SWIISH holdings. Finally, accumulated HTR fees can be distributed pro-rata to iSWIISH holders (minus a 5% owner fee).

---

## Key Features

1. **Dual-Token AMM**  
   - Users deposit Token A and Token B into the pool.  
   - Pricing follows a constant-product curve: x · y = k.  

2. **Liquidity Rewards**  
   - When adding liquidity, providers receive **iSWIISH** tokens.  
   - The iSWIISH reward is higher if the deposited token is underrepresented in the pool.  

3. **Swap Functionality**  
   - Traders can swap between Token A and Token B.  
   - A small HTR fee (0.1% of input, minimum 1 HTR) is charged on each swap.  
   - Traders receive 1 **uSWIISH** token per successful swap.  

4. **NFT Tiers & DAO Governance**  
   - There are two NFT tracks:  
     - **Investor DAO NFTs** (five levels: enterDAO, experiencedMember, superMember, legendaryMember, ultimateMember)  
     - **User DAO NFTs** (five levels: enterDAO, experiencedMember, superMember, legendaryMember, ultimateMember)  
   - Eligibility depends on SWIISH holdings.  
   - Users may stake SWIISH or U-SWIISH into an NFT reserve, then “claim” an NFT on-chain when they meet the threshold.

5. **HTR Fee Distribution**  
   - 5% of collected HTR fees go to the pool owner.  
   - 95% of fees are distributed pro-rata to all iSWIISH holders.  
   - Only the owner or an Investor with “experienceMember” NFT or higher may trigger distribution.  

6. **Withdrawal Mechanisms**  
   - **iSWIISH** and **uSWIISH** holders may withdraw their accrued balances.  
   - NFT-eligible users can claim exactly one NFT at a time.  
   - HTR distributions can be withdrawn by eligible addresses.

---

## Flow

1. **initialize(...)**  
   - Called once by the pool owner.  
   - Seeds SWIISH reserves with at least 1 000 iSWIISH and 1 000 uSWIISH.  
   - Sets Token A, Token B, NFT UIDs, and initializes all reserves and state maps.

2. **add_liquidity(...)**  
   - Liquidity provider deposits either Token A or Token B.  
   - They must withdraw the correct iSWIISH reward in the same transaction.  
   - The contract updates reserves and credits the user’s iSWIISH balance.

3. **add_swiish_liquidity(...)**  
   - Anyone can deposit additional iSWIISH or uSWIISH into the pool’s SWIISH reserve.  

4. **swap(...)**  
   - Trader deposits `token_in` and HTR fee, and withdraws `token_out` + 1 uSWIISH.  
   - The pool updates Token A & Token B reserves, collects the HTR fee, and rewards 1 uSWIISH.

5. **add_nft_liquidity(...)**  
   - Deposit any of the ten NFT UID tokens into the pool’s NFT reserve.  

6. **claim_nft(...)**  
   - User withdraws exactly 1 NFT if they meet the SWIISH holding threshold.  
   - The contract checks eligibility, burns one NFT from the reserve, and credits the user.

7. **distribute_htr(...)**  
   - Owner or Investor (≥ “experiencedMember” NFT) calls this to split the accumulated HTR fees.  
   - 5% goes to owner, and 95% is allocated pro-rata across all iSWIISH holders.  
   - Any rounding remainder remains in `htr_reserve`.

8. **withdraw_available_htr(...)**  
   - Any address with an HTR balance in `htr_withdrawable` can withdraw their full claim.
     
---![Screenshot from 2025-06-02 10-30-13](https://github.com/user-attachments/assets/810789c2-02ed-4610-8d25-e1d14198255d)


---

## State Variables & Data Structures

- **owner** `(Address)`  
  The address that deployed/initialized the contract.

- **token_a**, **token_b** `(TokenUid)`  
  UIDs of the two AMM tokens.

- **token_iswiish**, **token_uswiish** `(TokenUid)`  
  UIDs for the iSWIISH & uSWIISH reward tokens.

- **token_htr** `(TokenUid)`  
  UID of HTR (native coin) used for swap fees.

- **NFT UIDs** `(TokenUid)`  
  - Investor DAO:  
    `nft_i_enterDao`, `nft_i_experiencemember`, `nft_i_supermember`, `nft_i_legendary`, `nft_i_ultimate`  
  - User DAO:  
    `nft_u_enterDao`, `nft_u_experiencemember`, `nft_u_supermember`, `nft_u_legendary`, `nft_u_ultimate`

- **swap_reserve** `(dict[TokenUid, Amount])`  
  Tracks pool balances for Token A & Token B:  
  ```python
  self.swap_reserve = {
      token_a: 0,
      token_b: 0,
  }


