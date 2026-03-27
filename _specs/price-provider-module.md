# Price Provider Module Scaffold

## Overview

Create the foundational scaffold for a `PriceProviderModule` in the NestJS application. This module defines the contract (interface) that all price provider implementations must follow, along with a per-provider configuration model. The first concrete implementation will be a Worten provider (`worten.pt`), serving as the reference example.

## Goals

- Define a `PriceProvider` interface that all provider implementations must satisfy.
- Define a `ProviderConfig` model that holds provider-specific configuration (starting with just the provider URL).
- Scaffold the `PriceProviderModule` that can register and expose multiple provider implementations.
- Deliver a first working implementation: `WortenProvider`, targeting `www.worten.pt`.

## Non-Goals

- Actual price scraping/fetching logic (the Worten implementation stub only needs to satisfy the interface).
- HTTP client integration or external API calls.
- Caching of provider results.
- Any UI or REST endpoint exposure of provider data.

## User Stories

- As a developer, I want a clear interface to implement when adding a new price provider, so I know exactly what methods and shapes are required.
- As a developer, I want each provider to carry its own configuration (e.g. base URL), so provider-specific settings are co-located with the provider.
- As a developer, I want a reference implementation (Worten) that I can follow as a template when building future providers.

## Acceptance Criteria

- [ ] A `PriceProvider` interface is defined with at least one method for fetching the price of a product (e.g. `getPrice(productId: string): Promise<number>`).
- [ ] A `ProviderConfig` type/class is defined with at minimum a `url: string` field.
- [ ] Each provider implementation class accepts or holds a `ProviderConfig` instance.
- [ ] A `WortenProvider` class exists that implements the `PriceProvider` interface and is configured with `https://www.worten.pt` as its URL.
- [ ] A `PriceProviderModule` NestJS module exists that declares and exports the provider(s).
- [ ] The module is importable into `AppModule` without errors.
- [ ] Unit tests exist for the `WortenProvider` stub verifying it conforms to the interface.

## Out of Scope

- Price parsing, HTML scraping, or any real HTTP requests.
- Provider discovery or dynamic registration.
- Database persistence of provider configurations.
