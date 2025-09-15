# Contributing to here/now

Thanks for your interest in contributing to here/now! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Set up your environment variables (see `.env.example`)
5. Start the development server: `npm run dev`

## Development Setup

### Prerequisites
- Node.js 18+ 
- A Supabase database (or compatible PostgreSQL database)

### Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in your database connection details
3. Set `ALLOWED_DOMAINS` to include your development domains

### Database Setup
```bash
npm run db:push     # Push schema to database
npm run db:generate # Generate Prisma client
```

## Code Style

- We use ESLint for code linting and Prettier for formatting
- Run `npm run fix` to auto-format and fix linting issues
- Run `npm run lint` to check for any remaining issues
- Follow existing code patterns and conventions

## Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following these guidelines:
   - Write clear, descriptive commit messages
   - Keep changes focused and atomic
   - Add tests if applicable
   - Update documentation if needed

3. Test your changes:
   ```bash
   npm run fix      # Format code and fix linting issues
   npm run build    # Ensure the project builds
   ```

4. Push to your fork and create a pull request

## Pull Request Guidelines

- Provide a clear description of what your PR does
- Reference any related issues
- Include screenshots for UI changes
- Make sure all checks pass
- Keep PRs focused on a single feature/fix

## Reporting Issues

When reporting bugs, please include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Relevant logs or error messages

## Feature Requests

- Check existing issues before creating new ones
- Clearly describe the use case and benefit
- Consider if the feature aligns with the project's goals

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment for all contributors

## Questions?

Feel free to open an issue for questions about contributing or join discussions in existing issues.
