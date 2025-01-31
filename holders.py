from web3 import Web3
import requests
from bs4 import BeautifulSoup

# Connect to Ethereum via public RPC node
w3 = Web3(Web3.HTTPProvider('https://eth.llamarpc.com'))

def get_holders_etherscan(token_address):
    """Direct holder count from Etherscan with atomic selector"""
    try:
        url = f"https://etherscan.io/token/{token_address}"
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Atomic selector for holder count
        holders = soup.select_one('a[href*="tokenholdings"] div').text
        return int(holders.replace(',', ''))
    except Exception as e:
        print(f"Etherscan Error: {str(e)[:80]}")
        return None

def get_holders_onchain(token_address):
    """Get holders through ERC-20 contract interaction"""
    try:
        contract = w3.eth.contract(
            address=Web3.to_checksum_address(token_address),
            abi=['function totalSupply() view returns (uint256)',
                 'function balanceOf(address) view returns (uint256)']
        )
        
        # Get total supply and first holder balance
        total_supply = contract.functions.totalSupply().call()
        first_holder = contract.functions.balanceOf(w3.eth.accounts[0]).call()
        
        # Estimate holders (approximation for new tokens)
        return int(total_supply / (first_holder or 1))
    except Exception as e:
        print(f"Blockchain Error: {str(e)[:80]}")
        return None

def main():
    token_address = input("Enter ERC20 token address: ").strip().lower()
    
    print("\n=== Ethereum Holder Verification ===")
    print("Method 1: Etherscan Atomic Scrape...")
    print(f"Holders: {get_holders_etherscan(token_address) or 'N/A'}")
    
    print("\nMethod 2: On-Chain Estimation...")
    print(f"Estimated Holders: {get_holders_onchain(token_address) or 'N/A'}")

if __name__ == "__main__":
    main()