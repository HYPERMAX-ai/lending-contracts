# Lending

Compound-based lending markets, powered by an upgradeable `Comptroller` and a `PriceOracle` that talks to the HyperCore precompile.

```mermaid
flowchart LR
  subgraph HyperEVM
    Comp <-- get price --> O[PriceOracle]
  end

  subgraph HyperCore
    P[Price]
  end

  O <-- get price --> P
```

`SpotPriceOracle.sol`
- Wraps a single staticcall to the HyperCore mark-price precompile so on-chain prices stay in sync with the L1 engine

---

# Script

Deploy everything with `deploy.js`.
