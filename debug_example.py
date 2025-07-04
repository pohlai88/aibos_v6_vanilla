#!/usr/bin/env python3
"""
Debug Example for AIBOS Project
This script demonstrates how to use breakpoints and debugging features.
"""

import sys
import os

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def simple_calculation(a, b):
    """Simple function to demonstrate debugging."""
    result = a + b
    # Set breakpoint here to inspect variables
    print(f"Calculating {a} + {b} = {result}")
    return result

def process_user_data(user_id, user_data):
    """Process user data with validation."""
    # Set breakpoint here to inspect input data
    if not user_id or user_id <= 0:
        raise ValueError("Invalid user ID")
    
    if not user_data:
        raise ValueError("User data is required")
    
    # Set breakpoint here to inspect processed data
    processed_data = {
        "id": user_id,
        "name": user_data.get("name", "Unknown"),
        "email": user_data.get("email", ""),
        "status": "active"
    }
    
    return processed_data

def main():
    """Main function to demonstrate debugging workflow."""
    print("Starting AIBOS Debug Example")
    
    # Example 1: Simple calculation debugging
    print("\n=== Example 1: Simple Calculation ===")
    try:
        result = simple_calculation(10, 20)
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Example 2: User data processing debugging
    print("\n=== Example 2: User Data Processing ===")
    try:
        user_data = {"name": "John Doe", "email": "john@example.com"}
        processed = process_user_data(123, user_data)
        print(f"Processed user: {processed}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Example 3: Error handling debugging
    print("\n=== Example 3: Error Handling ===")
    try:
        # This will raise an error - good for debugging error handling
        processed = process_user_data(0, {})
        print(f"Processed user: {processed}")
    except Exception as e:
        print(f"Caught error: {e}")
    
    print("\nDebug example completed!")

if __name__ == "__main__":
    main() 