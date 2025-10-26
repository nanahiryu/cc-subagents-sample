# Project Overview

## Purpose

Demonstrate the use of **subagents** (owner/executer/checker) for systematic feature development using a Todo CRUD application as a baseline.

## Goals

- Build a minimal Todo CRUD app as a foundation
- Use subagents to add features in a structured, measurable way
- Compare development metrics (tokens, messages, cycles) between agent-based and traditional approaches

## Approach

1. **Base Implementation**: Simple Todo CRUD (React + Hono + Prisma + PostgreSQL)
2. **Feature Addition**: Use subagents to add features incrementally
3. **Quality Assurance**: Automated tests, lint, and type checking at each step

## Branches

- `main`: Base Todo CRUD implementation
- `release/agents`: Feature additions using subagents
- `release/no-agents`: (Optional) Same features without subagents for comparison

## Current Status

Base implementation completed on `main` branch. Ready for subagent-based feature development.
