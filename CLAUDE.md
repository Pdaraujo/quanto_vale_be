# CLAUDE.md

This project is a REST API for getting current product prices and generate best second hand prices for the same products

## Commands

Always use pnpm to run commands for this project. Check package.json to see all available commands.

## Architecture

NestJS REST API with and Redis caching.

## NestJS Conventions

When creating a new module, service, controller, or any other NestJS artifact, always use the NestJS CLI (via pnpm) to generate it. For example:

```
pnpm nest generate module <name>
pnpm nest generate service <name>
pnpm nest generate controller <name>
```
