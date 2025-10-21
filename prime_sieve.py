def sieve_of_eratosthenes(limit):
    """
    Find all prime numbers up to a given limit using the Sieve of Eratosthenes.
    
    Args:
        limit: The upper bound for finding primes
        
    Returns:
        A list of prime numbers up to the limit
    """
    if limit < 2:
        return []
    
    # Create a boolean array "is_prime" and initialize all entries as true
    is_prime = [True] * (limit + 1)
    is_prime[0] = is_prime[1] = False
    
    p = 2
    while p * p <= limit:
        # If is_prime[p] is not changed, then it's a prime
        if is_prime[p]:
            # Mark all multiples of p as not prime
            for i in range(p * p, limit + 1, p):
                is_prime[i] = False
        p += 1
    
    # Collect all numbers that are still marked as prime
    primes = [num for num in range(limit + 1) if is_prime[num]]
    return primes


if __name__ == "__main__":
    # Example usage
    limit = 100
    primes = sieve_of_eratosthenes(limit)
    print(f"Prime numbers up to {limit}:")
    print(primes)
    print(f"\nTotal count: {len(primes)}")
