from web3 import Web3
import json
from decimal import Decimal, getcontext

# Set higher precision for Decimal calculations
getcontext().prec = 28

PAIR_ABI = json.loads('''[{"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}]''')

ERC20_ABI = json.loads('''[{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"}]''')

class TokenPricer:
    def __init__(self, rpc_url):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not self.w3.is_connected():
            raise Exception("Failed to connect to Ethereum node")
        print("\n[Network] Connected to Ethereum node")

    def get_token_info(self, token_address):
        """Get token symbol and decimals with debug output"""
        print(f"\n[Token Info] Fetching details for {token_address}")
        token_contract = self.w3.eth.contract(address=token_address, abi=ERC20_ABI)
        symbol = token_contract.functions.symbol().call()
        decimals = token_contract.functions.decimals().call()
        print(f"[Token Info] Found {symbol} with {decimals} decimals")
        return symbol, decimals

    def calculate_price(self, reserve0, reserve1, decimals0, decimals1):
        """Calculate price with detailed debug output"""
        print("\n[Calculation] Converting reserves to adjusted values:")
        adjusted_reserve0 = Decimal(reserve0) / Decimal(10 ** decimals0)
        adjusted_reserve1 = Decimal(reserve1) / Decimal(10 ** decimals1)
        print(f"Reserve0: {reserve0} -> {adjusted_reserve0:.8f}")
        print(f"Reserve1: {reserve1} -> {adjusted_reserve1:.8f}")
        
        print("\n[Calculation] Price ratios:")
        price0_in_1 = adjusted_reserve1 / adjusted_reserve0
        price1_in_0 = adjusted_reserve0 / adjusted_reserve1
        print(f"1 token0 = {price0_in_1:.8f} token1")
        print(f"1 token1 = {price1_in_0:.8f} token0")
        return price0_in_1, price1_in_0

    def get_price(self, pair_address):
        """Calculate token price from Uniswap V2 pair with debug steps"""
        print(f"\n[Pair Analysis] Starting analysis for pair: {pair_address}")
        pair_address = Web3.to_checksum_address(pair_address)
        pair_contract = self.w3.eth.contract(address=pair_address, abi=PAIR_ABI)

        # Get token addresses
        token0_address = pair_contract.functions.token0().call()
        token1_address = pair_contract.functions.token1().call()
        print(f"\n[Pair Structure] Token0: {token0_address}")
        print(f"[Pair Structure] Token1: {token1_address}")

        # Get token information
        token0_symbol, token0_decimals = self.get_token_info(token0_address)
        token1_symbol, token1_decimals = self.get_token_info(token1_address)

        # Get reserves
        print("\n[Reserves] Fetching pool reserves...")
        reserves = pair_contract.functions.getReserves().call()
        reserve0 = reserves[0]
        reserve1 = reserves[1]
        print(f"Raw Reserve0: {reserve0} ({token0_symbol})")
        print(f"Raw Reserve1: {reserve1} ({token1_symbol})")

        # Calculate prices
        price0_in_1, price1_in_0 = self.calculate_price(reserve0, reserve1, token0_decimals, token1_decimals)
        
        return {
            'token0': {'symbol': token0_symbol, 'decimals': token0_decimals},
            'token1': {'symbol': token1_symbol, 'decimals': token1_decimals},
            'price0_in_1': price0_in_1,
            'price1_in_0': price1_in_0
        }

    def get_eth_usd_price(self):
        """Get ETH/USD price from USDC/WETH pair with debug output"""
        print("\n[ETH Price] Fetching ETH/USD price from USDC/WETH pair")
        usdc_weth_pair = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"
        usdc_data = self.get_price(usdc_weth_pair)
        eth_usd_price = float(usdc_data['price1_in_0'])  # 1 WETH = X USDC
        print(f"\n[ETH Price] 1 ETH = ${eth_usd_price:.2f} USD")
        return eth_usd_price

def main():
    print("\n=== Uniswap V2 Price Calculator with USD Conversion ===")
    rpc_url = "https://mainnet.infura.io/v3/891ad2c6a9db45de8e1429875362cf4f"
    
    try:
        pricer = TokenPricer(rpc_url)
    except Exception as e:
        print(f"Connection error: {str(e)}")
        return

    while True:
        pair_address = input("\nEnter Uniswap V2 pair address (or Enter to exit): ").strip()
        if not pair_address:
            print("Exiting...")
            break

        try:
            # Get pair price data
            print("\n" + "="*50)
            pair_data = pricer.get_price(pair_address)
            
            # Get ETH/USD price
            eth_usd_price = pricer.get_eth_usd_price()
            
            # Calculate USD values
            print("\n[Conversion] Calculating USD prices:")
            token0_price_usd = float(pair_data['price0_in_1']) * eth_usd_price
            token1_price_usd = float(pair_data['price1_in_0']) * eth_usd_price
            
            print(f"\nFinal Prices:")
            print(f"1 {pair_data['token0']['symbol']} = {pair_data['price0_in_1']:.8f} WETH")
            print(f"1 {pair_data['token0']['symbol']} = ${token0_price_usd:.6f} USD")
            print(f"\n1 {pair_data['token1']['symbol']} = {pair_data['price1_in_0']:.8f} {pair_data['token0']['symbol']}")
            print(f"1 {pair_data['token1']['symbol']} = ${token1_price_usd:.2f} USD")
            print("="*50)

        except Exception as e:
            print(f"\nError: {str(e)}")

if __name__ == "__main__":
    main()