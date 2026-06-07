# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with extension, backend, and dashboard workspaces
- PDF CV parsing with pdf.js (client-side only)
- GitHub profile data fetching via REST API
- Skill gap detection between CV and GitHub languages
- Date inconsistency detection across CV and commit activity
- Portfolio detection in React SPAs (including JS closure extraction)
- Cross-check report generation with flagged inconsistencies
- Content script for GitHub page interaction
- Service worker background orchestrator
- Test suite with Vitest (cross-checker, CV extractor, report generator)
- TypeScript strict mode configuration

### Infrastructure
- esbuild bundler for Chrome Extension (Manifest V3)
- CI-ready test configuration with Vitest
- Linting setup with ESLint + TypeScript-ESLint
- GitHub Actions workflows for testing and builds
