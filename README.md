# EGO!ST Bot

![Discord.js](https://img.shields.io/badge/Discord.js-v14.15.3-blue) ![Node.js](https://img.shields.io/badge/Node.js-v16+-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

EGO!ST Bot is a feature-rich Discord bot for the EGO!ST ROLEPLAY server, built with Discord.js v14. It offers giveaways, ticket systems, reaction-based verification, invite tracking, and moderation tools, optimized for deployment on Replit or any Node.js environment.

## Features

- **Giveaways**: Customizable prize giveaways with duration and winner options  
- **Tickets**: Private support channels/threads with auto-close  
- **Reaction Roles**: Emoji-based verification  
- **Invite Tracking**: Logs who invited new members  
- **Moderation**: Kick/ban notifications  

## Prerequisites

- Node.js v16+  
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))  

## Installation

1. **Clone Repository**:  
   ```bash
   git clone https://github.com/yourusername/EGOIST-Bot.git && cd EGOIST-Bot
   ```
2. **Install Dependencies**:  
   ```bash
   npm install
   ```
3. **Set Up Environment Variables**:  
   Create a `.env` file or use Replit Secrets:  
   ```text
   TOKEN=your_discord_bot_token
   SERVER_RULES_CHANNEL_ID=channel_id
   RULES_CHANNEL_ID=channel_id
   TICKET_CATEGORY_ID=category_id
   NOTIFICATION_CHANNEL_ID=channel_id
   TRANSCRIPT_CHANNEL_ID=channel_id
   REACTION_ROLE_CHANNEL_ID=channel_id
   INVITE_LOG_CHANNEL_ID=channel_id
   VERIFICATION_ROLE_ID=role_id
   ```
   Replace placeholders with your server’s IDs.

4. **Run the Bot**:  
   ```bash
   npm start
   ```

## Usage

### Commands

- `/giveaway create [prize] [winners] [duration] [start] [color]` – e.g., `/giveaway create "Cool Prize" 2 1h`
- `/giveaway end [messageid]` – End a giveaway early
- `/reactionrole [role] [emoji]` – Set up verification (Admin only)
- `/ticket` – Create a new ticket channel
- `/thread-ticket` – Create a new ticket thread
- `/close [reason]` – Request ticket closure
- `/force-close [reason]` – Force close ticket (Staff only)
- `/close-all [category]` – Close all tickets in a category (Staff only)

### Buttons

- **Join Giveaway** – Enter giveaways
- **Close Ticket** – Start ticket closure

## Deployment on Replit

1. **Import**:  
   - Create a Repl, select "Import from GitHub", use `https://github.com/yourusername/EGOIST-Bot`

2. **Add Secrets**:  
   - In the "Secrets" tab, add variables from the Installation section

3. **Install**:  
   - Auto-runs `npm install` with `package.json`

4. **Run**:  
   - Click "Run" (`.replit` sets `run = "node index.js"`)

## Configuration

- **Channel IDs**: Match variables to your server
- **Role IDs**: Set `VERIFICATION_ROLE_ID` for verification
- **Inactivity Timeout**: Edit `INACTIVITY_TIMEOUT` (default: 24h)

## Project Structure

```text
EGOIST-Bot/
├── .replit       # Replit config
├── index.js      # Main bot file
├── package.json  # Dependencies/scripts
├── README.md     # This file
└── .gitignore    # Git ignore
```

## Contributing

1. **Fork the repo**
2. **Create a branch**:  
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit changes**:  
   ```bash
   git commit -m "Add your feature"
   ```
4. **Push changes**:  
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request**

For major changes, open an issue first.

## Troubleshooting

- **Bot Not Responding**: Verify token/permissions
- **Commands Not Registering**: Check `applications.commands` scope
- **Replit Errors**: Confirm secrets and server status

## License

MIT License

## Acknowledgments

- **Discord.js**
- **EGO!ST ROLEPLAY Community**

