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

You have three ways to get the server credentials in place. Pick whichever fits.

Just start asking your MCP client questions like "Show me my RetroAchievements
profile." The first call will fail with a structured "credentials not configured"
message that gives the assistant two choices to offer you.

### 1A. In-chat paste (fastest)

You paste your username and Web API key into the chat. The assistant calls
`ra_save_credentials`, which validates the key against the live API and saves
it. **Downside:** the key is in your chat transcript.

### 1B. Edit a file the assistant scaffolds (key never touches chat)

The assistant calls `ra_prepare_credentials_file`, which writes a placeholder
`credentials.env` in your user config dir and returns a `file://` link. You
click the link, paste your key in the file, save. The server picks it up on
the next tool call. **Upside:** key never appears in the transcript.

Either way, credentials end up at:

- Windows: `%APPDATA%\retroachievements-mcp\credentials.env`
- macOS: `~/Library/Application Support/retroachievements-mcp/credentials.env`
- Linux: `$XDG_CONFIG_HOME/retroachievements-mcp/credentials.env`

The assistant can call `ra_status` at any time to see whether setup is done,
half-done (placeholder file waiting for a key), or not started.

### 2. Interactive CLI

```bash
npm run setup
```

Walks you through getting an account (if needed), prompts for your Web API key,
verifies against the API, and saves to the same user config dir.

### 3. Env vars in your MCP client config

Set `RA_USERNAME` and `RA_API_KEY` as `env` entries in your MCP client's server
config (see [Use with Claude Code](#use-with-claude-code)). The server reads
env vars first, then falls back to the stored file. Env vars never touch the
chat history.

## Configure

The server reads two environment variables at startup:

| Variable      | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| `RA_USERNAME` | Your RetroAchievements username.                                     |
| `RA_API_KEY`  | Your Web API key (find it at https://retroachievements.org/controlpanel.php). |

Pass the values as `env` entries in your MCP client config (see below) — those
take precedence over the stored credentials file.

If you launch the server without env vars set and no stored credentials, it
will still start and respond to MCP clients — but every tool call returns a
friendly error pointing the assistant at `ra_save_credentials` /
`ra_prepare_credentials_file`. A missing key never silently bricks the
connection.

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

### Setup

| Tool                            | Description                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `ra_status`                     | Reports configured / source (env, file, file-pending, none) / username / file path.               |
| `ra_save_credentials`           | In-chat flow: validates a username + key the user typed, then writes them to the user config.     |
| `ra_prepare_credentials_file`   | Out-of-chat flow: writes a placeholder file the user opens locally, pastes their key, and saves.  |

### User

| Tool                              | Description                                                          |
| --------------------------------- | -------------------------------------------------------------------- |
| `ra_user_profile`                 | Basic profile (points, rank, motto, avatar).                         |
| `ra_user_summary`                 | Profile + recent games + recent achievements + awards.               |
| `ra_user_recent_achievements`     | Achievements unlocked in the last N minutes.                         |
| `ra_user_recently_played_games`   | Recently played games with progress.                                 |
| `ra_user_completion_progress`     | All started games with completion %, hardcore status, award level.   |
| `ra_user_awards`                  | Site awards earned (mastery, beaten, events).                        |
| `ra_user_want_to_play`            | The user's want-to-play wishlist.                                    |
| `ra_user_completed_games`         | Games the user has fully mastered (softcore and/or hardcore).        |
| `ra_user_achievements_between`    | Achievements earned between two ISO dates.                           |

### Game

| Tool                      | Description                                                          |
| ------------------------- | -------------------------------------------------------------------- |
| `ra_game`                 | Basic game metadata (title, console, developer, box art).            |
| `ra_game_extended`        | Full game info with the achievement list and unlock counts.          |
| `ra_game_rank_and_score`  | High-score holders OR latest masters for a game (pick via `type`).   |

### Console

| Tool             | Description                                                                       |
| ---------------- | --------------------------------------------------------------------------------- |
| `ra_console_ids` | All consoles RA tracks. Use to translate names like "SNES" to a consoleId.        |
| `ra_game_list`   | All games on a console, optionally filtered to those with achievement sets.       |

### Achievement

| Tool                      | Description                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `ra_achievement_unlocks`  | Users who have unlocked a specific achievement, with timestamps and totals.            |

### Leaderboard

| Tool                          | Description                                                                |
| ----------------------------- | -------------------------------------------------------------------------- |
| `ra_leaderboard_entries`      | Top entries for a leaderboard.                                             |
| `ra_user_game_leaderboards`   | All leaderboards a user has placed on for a given game.                    |

### Feed

| Tool                          | Description                                              |
| ----------------------------- | -------------------------------------------------------- |
| `ra_achievement_of_the_week`  | Currently featured achievement-of-the-week + leaderboard. |
| `ra_top_ten_users`            | Site's top-ten ranked users by hardcore points.          |

More are easy to add (comments, tickets, claims, hashes, achievement
distribution, points/progress, follows) — see `src/tools/` for the pattern.

## Develop

```bash
npm run dev     # tsx, no build step
npm run build   # compile to dist/
npm start       # run the compiled server
```

## License

MIT
