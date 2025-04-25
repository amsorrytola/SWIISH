class AMMSwapBlueprint(Blueprint):
    def __init__(self):
        self.token_a = None
        self.token_b = None
        self.reserve_a = 0
        self.reserve_b = 0
        self.total_lp_tokens = 0
        self.lp_balances = {}

    def on_init(self, args: dict):
        self.token_a = args['token_a']
        self.token_b = args['token_b']

    def add_liquidity(self, context: Context, args: dict):
        amount_a = args['amount_a']
        amount_b = args['amount_b']
        provider = context.tx.sender

        # Transfer tokens from provider to contract
        context.transfer_from(provider, self.token_a, amount_a)
        context.transfer_from(provider, self.token_b, amount_b)

        # Update reserves
        self.reserve_a += amount_a
        self.reserve_b += amount_b

        # Mint LP tokens
        lp_tokens = min(amount_a * self.total_lp_tokens // self.reserve_a if self.reserve_a else amount_a,
                        amount_b * self.total_lp_tokens // self.reserve_b if self.reserve_b else amount_b)
        self.lp_balances[provider] = self.lp_balances.get(provider, 0) + lp_tokens
        self.total_lp_tokens += lp_tokens

    def remove_liquidity(self, context: Context, args: dict):
        lp_tokens = args['lp_tokens']
        provider = context.tx.sender

        assert self.lp_balances.get(provider, 0) >= lp_tokens, "Insufficient LP tokens"

        amount_a = lp_tokens * self.reserve_a // self.total_lp_tokens
        amount_b = lp_tokens * self.reserve_b // self.total_lp_tokens

        self.lp_balances[provider] -= lp_tokens
        self.total_lp_tokens -= lp_tokens

        self.reserve_a -= amount_a
        self.reserve_b -= amount_b

        # Transfer tokens back to provider
        context.transfer(provider, self.token_a, amount_a)
        context.transfer(provider, self.token_b, amount_b)

    def swap(self, context: Context, args: dict):
        input_token = args['input_token']
        input_amount = args['input_amount']
        trader = context.tx.sender

        assert input_token in [self.token_a, self.token_b], "Invalid token"

        output_token = self.token_b if input_token == self.token_a else self.token_a
        reserve_in = self.reserve_a if input_token == self.token_a else self.reserve_b
        reserve_out = self.reserve_b if input_token == self.token_a else self.reserve_a

        # Apply 0.3% fee
        input_amount_with_fee = input_amount * 997 // 1000
        numerator = input_amount_with_fee * reserve_out
        denominator = reserve_in + input_amount_with_fee
        output_amount = numerator // denominator

        # Update reserves
        if input_token == self.token_a:
            self.reserve_a += input_amount
            self.reserve_b -= output_amount
        else:
            self.reserve_b += input_amount
            self.reserve_a -= output_amount

        # Transfer tokens
        context.transfer_from(trader, input_token, input_amount)
        context.transfer(trader, output_token, output_amount)
