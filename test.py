import os
import logging
import requests
from web3 import Web3
from dotenv import load_dotenv
from requests.exceptions import RequestException
from web3.exceptions import ContractLogicError, BadFunctionCallOutput

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class TokenPriceFetcher:
    def __init__(self, token_address):
        self.token_address = Web3.to_checksum_address(token_address)
        self.results = {}

    # ... [Keep all the API methods unchanged from previous version] ...

def main():
    print("Uniswap Token Price Checker")
    print("---------------------------\n")
    
    while True:
        token_address = input("Enter ERC20 token address (0x...) or 'q' to quit: ").strip()
        
        if token_address.lower() in ['q', 'quit', 'exit']:
            print("Exiting program...")
            break
            
        try:
            # Validate address format
            if not Web3.is_address(token_address):
                print("Error: Invalid Ethereum address format\n")
                continue
                
            fetcher = TokenPriceFetcher(token_address)
            results = fetcher.run_all_checks()
            
            print("\n=== Results ===")
            for api_name, data in results.items():
                print(f"\n{api_name.upper()}:")
                if data is None:
                    print("  No data retrieved")
                else:
                    for k, v in data.items():
                        print(f"  {k}: {v}")
            print("\n" + "="*30 + "\n")
            
        except Exception as e:
            logger.error(f"Critical error processing address: {str(e)}")
            print("Failed to process request. Please try again.\n")

if __name__ == "__main__":
    main()