# Reference

The reference layer is where the 360 Flatmates web app stops explaining itself in prose and starts listing things exactly. These pages are the lookup tables you reach for when a token, an env var, a type field, or a dependency version needs to be right, not argued about.

Each child page is a single flat surface, no narrative:

- [Configuration](configuration.md): every environment variable and every config file at the repo root, with what each one does and how the env layer flows from `.env` into the running app.
- [Data models](data-models.md): the core domain types (`User`, `FlatmatesProfile`, `Property`, `Conversation`, `Message`, `Visit`, `Match`, `Notification`), their fields, and how they relate. Treat the OpenAPI spec as the canonical source.
- [Dependencies](dependencies.md): every runtime and dev dependency in `package.json`, grouped by purpose, with versions and what each one is for.

If you are new to the repo, read [getting started](../overview/getting-started.md) first. This reference assumes you already know where the pieces live and only need the precise shape of one.
