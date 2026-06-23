# retroachievements-mcp

A [Model Context Protocol](https://modelcontextprotocol.io/) server that exposes the
[RetroAchievements](https://retroachievements.org/) public API to MCP-compatible
clients like Claude Code, Claude Desktop, and Cursor.

Built on top of the official [`@retroachievements/api`](https://github.com/RetroAchievements/api-js)
TypeScript SDK.

## What you can do with it

- "What achievements did I unlock in the last hour?"
- "Summarize my RetroAchievements activity this month."
- "Show me the achievement list for Super Mario 64."
- "Who are the top-ten ranked players right now?"
- "How rare is each achievement in The Legend of Zelda: A Link to the Past?"

## Requirements

- Node.js 18+
- A RetroAchievements account and Web API key
  ([Settings → Keys](https://retroachievements.org/controlpanel.php))

## Install

```bash
git clone https://github.com/Zach-Houston/retroachievements-mcp.git
cd retroachievements-mcp
npm install
npm run build
```

## First-time setup

If you don't have a Web API key yet (or aren't sure where to find one), run:

```bash
npm run setup
```

The setup CLI will:

1. Point you at the [sign-up page](https://retroachievements.org/createaccount.php)
   if you don't have a RetroAchievements account.
2. Ask for your username.
3. Point you at the [control panel](https://retroachievements.org/controlpanel.php)
   to copy your Web API key.
4. Verify the credentials against the API.
5. Write them to `.env` in the project root.

If you already have a key, you can skip the script and configure manually instead.

## Configure

The server reads two environment variables at startup:

| Variable      | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| `RA_USERNAME` | Your RetroAchievements username.                                     |
| `RA_API_KEY`  | Your Web API key (find it at https://retroachievements.org/controlpanel.php). |

A `.env.example` is included as a template — copy it to `.env` for local dev, or
pass the values as `env` entries in your MCP client config (see below).

If you launch the server without these set, it will still start and respond
to MCP clients — but every tool call returns a friendly error explaining how
to finish setup. This means a missing key never silently bricks the connection.

## Use with Claude Code

Add this to your Claude Code MCP config (`~/.claude.json` or via `claude mcp add`):

```json
{
  "mcpServers": {
    "retroachievements": {
      "command": "node",
      "args": ["C:/Users/Z/projects/retroachievements-mcp/dist/index.js"],
      "env": {
        "RA_USERNAME": "YourUserName",
        "RA_API_KEY": "your-web-api-key"
      }
    }
  }
}
```

Or, after `npm link`, you can use the `retroachievements-mcp` binary directly.

## Use with Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "retroachievements": {
      "command": "node",
      "args": ["C:/Users/Z/projects/retroachievements-mcp/dist/index.js"],
      "env": {
        "RA_USERNAME": "YourUserName",
        "RA_API_KEY": "your-web-api-key"
      }
    }
  }
}
```

## Tools

### User

| Tool                              | Description                                                          |
| --------------------------------- | -------------------------------------------------------------------- |
| `ra_user_profile`                 | Basic profile (points, rank, motto, avatar).                         |
| `ra_user_summary`                 | Profile + recent games + recent achievements + awards.               |
| `ra_user_recent_achievements`     | Achievements unlocked in the last N minutes.                         |
| `ra_user_recently_played_games`   | Recently played games with progress.                                 |
| `ra_user_completion_progress`     | All started games with completion %, hardcore status, award level.   |
| `ra_user_awards`                  | Site awards earned (mastery, beaten, events).                        |
| `ra_user_achievements_between`    | Achievements earned between two ISO dates.                           |

### Game

| Tool                | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| `ra_game`           | Basic game metadata (title, console, developer, box art).            |
| `ra_game_extended`  | Full game info with the achievement list and unlock counts.          |

### Feed

| Tool                          | Description                                              |
| ----------------------------- | -------------------------------------------------------- |
| `ra_achievement_of_the_week`  | Currently featured achievement-of-the-week + leaderboard. |
| `ra_top_ten_users`            | Site's top-ten ranked users by hardcore points.          |

More tools (leaderboards, console game lists, comments, tickets, claims, hashes,
distribution) are planned — see `src/tools/` to add your own.

## Develop

```bash
npm run dev     # tsx, no build step
npm run build   # compile to dist/
npm start       # run the compiled server
```

## License

MIT
