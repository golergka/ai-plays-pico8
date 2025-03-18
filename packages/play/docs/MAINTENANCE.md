# Documentation Maintenance Guidelines - Play Package

**NOTE: When making changes to this document that would benefit all packages, please propagate these changes to all package-specific MAINTENANCE.md files.**

## Documentation Structure

This project maintains several key documentation files:

1. **README.md**: Project overview, setup instructions, basic usage examples
2. **CLAUDE.md**: LLM-targeted documentation with workflow instructions
3. **TASKS.md**: Current tasks, priorities, and work tracking
4. **TESTING.md**: Testing philosophy, approaches, and guidelines
5. **ARCHITECTURE.md**: System architecture, design decisions, component relationships
6. **API.md** (when applicable): API documentation, endpoints, request/response formats

## Document Update Frequency

| Document | Update Frequency | Update Responsibility |
|----------|------------------|----------------------|
| README.md | When public interfaces change | Developer making changes |
| CLAUDE.md | When workflows change | AI or developer |
| TASKS.md | Continuously | AI and developers |
| TESTING.md | When testing approaches change | Developer making changes |
| ARCHITECTURE.md | When significant architectural changes occur | Lead developer |
| API.md | When API changes | Developer making API changes |

## Documentation Health Check

A documentation health check should be performed regularly:

```bash
./scripts/doc_health.sh
```

This script checks for:
- Broken internal links
- Outdated commands or references
- Consistency between docs and implementation
- Missing sections in key documentation files

## Documentation Standards

### General Guidelines

- Use clear, consistent formatting
- Keep documentation up-to-date with code changes
- Document the "why" as well as the "how"
- Include examples for complex concepts
- Avoid jargon without explanation
- Use diagrams for complex relationships

### Markdown Style

- Use proper Markdown heading hierarchy
- Include a table of contents for longer documents
- Use code blocks with appropriate language tags
- Capitalize proper nouns and acronyms
- Use numbered lists for sequential steps
- Use bullet points for non-sequential items

## Adding New Documentation

When adding new documentation:

1. Follow the established format and style
2. Update the table of contents if applicable
3. Add links to the new documentation from related docs
4. Include the new document in the doc health check

## Handling Documentation Debt

Documentation debt should be tracked in TASKS.md like any other task:

1. Create a task with the [DOC] prefix
2. Specify which documents need updating and why
3. Include acceptance criteria for documentation quality
4. Prioritize critical documentation updates

## AI-Human Collaboration on Documentation

When collaborating with AI on documentation:

1. AI can draft and update documentation based on code changes
2. Human review is required for all documentation changes
3. AI should follow the documentation standards outlined here
4. AI should propagate common changes across all relevant docs
5. AI can suggest documentation improvements as separate tasks

## Documentation Reviews

Documentation should be reviewed for:

- Technical accuracy
- Completeness
- Clarity and readability
- Consistency with other documentation
- Adherence to project standards
- Usefulness to the target audience

## Version Control for Documentation

- Documentation is versioned alongside code
- Major documentation changes should be mentioned in commit messages
- Use conventional commit messages with the "docs" type: `docs: update installation instructions`
- Documentation-only PRs should be labeled accordingly

## External Resources

When referencing external resources:

1. Include the full URL
2. Note the date accessed
3. Consider including a brief summary of the resource
4. Be aware that external resources may change or become unavailable