const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
} = require("discord.js");
const http = require("http");
const cron = require("node-cron");

// Keep Replit alive
http.createServer((req, res) => {
    res.write("EGO!ST is alive!");
    res.end();
}).listen(8080);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildInvites,
    ],
});

// Environment variables from Replit Secrets with placeholders
const Token = process.env.TOKEN || "<TOKEN>";
const SERVER_RULES_CHANNEL_ID = process.env.SERVER_RULES_CHANNEL_ID || "<CHANNELID>";
const RULES_CHANNEL_ID = process.env.RULES_CHANNEL_ID || "<CHANNELID>";
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || "<CHANNELID>";
const NOTIFICATION_CHANNEL_ID = process.env.NOTIFICATION_CHANNEL_ID || "<CHANNELID>";
const TRANSCRIPT_CHANNEL_ID = "<CHANNELID>";
const BIRTHDAY_CHANNEL_ID = "<CHANNELID>";

// Birthday system
const birthdays = new Map();
const birthdayCheck = cron.schedule('0 0 * * *', async () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    for (const [userId, birthday] of birthdays) {
        if (birthday.month === month && birthday.day === day) {
            const channel = client.channels.cache.get(BIRTHDAY_CHANNEL_ID);
            if (channel) {
                const birthdayEmbed = new EmbedBuilder()
                    .setTitle("🎉 Happy Birthday! 🎂")
                    .setDescription(`Happy Birthday <@${userId}>! 🎉\n\nWishing you a fantastic day filled with joy, laughter, and unforgettable moments! May this special day bring you all the happiness you deserve. Here's to another amazing year! 🎂✨\n\nFrom all of us at EGO!ST ROLEPLAY, we hope your day is as awesome as you are! 🌟`)
                    .setColor("#f45142")
                    .setTimestamp()
                    .setFooter({ text: "||From: EGO!ST TEAM||" });

                await channel.send({ embeds: [birthdayEmbed] });
            }
        }
    }
});
const REACTION_ROLE_CHANNEL_ID = "<CHANNELID>";
const INVITE_LOG_CHANNEL_ID = "<CHANNELID>";
const VERIFICATION_ROLE_ID = "<ROLEID>";
const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

const commands = [];
const giveaways = new Map();
const reactionRoles = new Map();
const tickets = new Map();
const inviteCache = new Map();

const joinButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("join_giveaway").setLabel("Join").setStyle(ButtonStyle.Primary),
);

const closeButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("close_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger),
);

const confirmButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("confirm_close").setLabel("Confirm").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("cancel_close").setLabel("Cancel").setStyle(ButtonStyle.Secondary),
);

// Define slash commands
commands.push(
    new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Manage giveaways")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create a new giveaway")
                .addStringOption((option) => option.setName("prize").setDescription("The prize").setRequired(true))
                .addIntegerOption((option) => option.setName("winners").setDescription("Number of winners").setRequired(true))
                .addStringOption((option) => option.setName("duration").setDescription("Duration (e.g., 1h, 30m, 1d)").setRequired(true))
                .addStringOption((option) => option.setName("start").setDescription("Start time (e.g., 2025-02-22 14:00 PST)").setRequired(false))
                .addStringOption((option) => option.setName("color").setDescription("Embed color (hex, e.g., #FF0000)").setRequired(false)),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("end")
                .setDescription("End a giveaway early")
                .addStringOption((option) => option.setName("messageid").setDescription("Message ID of the giveaway").setRequired(true)),
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName("reactionrole")
        .setDescription("Set up a reaction role in channel 1324009841504550966 (Admin only)")
        .addRoleOption((option) => option.setName("role").setDescription("The role to assign").setRequired(true))
        .addStringOption((option) => option.setName("emoji").setDescription("The emojis to react with (comma-separated, e.g., 👍,👋,🎉)").setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .toJSON(),
    new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Create a support ticket")
        .toJSON(),
    new SlashCommandBuilder()
        .setName("close")
        .setDescription("Request to close a ticket")
        .addStringOption((option) => option.setName("reason").setDescription("Reason for closing").setRequired(false))
        .toJSON(),
    new SlashCommandBuilder()
        .setName("force-close")
        .setDescription("Force close a ticket (Staff only)")
        .addStringOption((option) => option.setName("reason").setDescription("Reason for closing").setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
        .toJSON(),
    new SlashCommandBuilder()
        .setName("thread-ticket")
        .setDescription("Create a ticket as a thread")
        .toJSON(),
    new SlashCommandBuilder()
        .setName("close-all")
        .setDescription("Close all tickets in a category (Staff only)")
        .addStringOption((option) => option.setName("category").setDescription("Category ID").setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
        .toJSON(),
    new SlashCommandBuilder()
        .setName("birthday")
        .setDescription("Set or view birthday information")
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Set your birthday")
                .addIntegerOption(option => option.setName("day").setDescription("Day of birth").setRequired(true).setMinValue(1).setMaxValue(31))
                .addIntegerOption(option => option.setName("month").setDescription("Month of birth").setRequired(true).setMinValue(1).setMaxValue(12))
                .addIntegerOption(option => option.setName("year").setDescription("Year of birth").setRequired(false)))
        .toJSON()
);

client.once("ready", async () => {
    console.log("Bot is online!");
    try {
        await client.application.commands.set(commands);
        console.log("Slash Commands registered successfully!");

        // Initialize invite cache for all guilds
        client.guilds.cache.forEach(async (guild) => {
            try {
                const invites = await guild.invites.fetch();
                const guildInvites = new Map();
                invites.forEach(invite => guildInvites.set(invite.code, invite.uses));
                inviteCache.set(guild.id, guildInvites);
                console.log(`Invite cache initialized for guild ${guild.name} (${guild.id})`);
            } catch (error) {
                console.error(`Failed to fetch invites for guild ${guild.name}: ${error}`);
            }
        });
    } catch (error) {
        console.error(`Failed to register commands or initialize invite cache: ${error}`);
    }
});

// Welcome message and invite tracking handler
client.on("guildMemberAdd", async (member) => {
    const guild = member.guild;
    const inviteLogChannel = guild.channels.cache.get(INVITE_LOG_CHANNEL_ID);

    // Send welcome message
    try {
        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`Welcome to ${guild.name}!`)
            .setDescription(`👋 ${member.user.username}, welcome to ${guild.name}!\n\nWe're thrilled to have you here! 🎉 Make sure to:\n\n🧑‍💻 Verify at: <#${REACTION_ROLE_CHANNEL_ID}> By Reaction\n📖 Read the server rules at: <#${RULES_CHANNEL_ID}>\nLet us know if you need any help. Enjoy your stay!🧑‍💻`)
            .setColor("#FF00FF") // Purple color
            .setTimestamp()
            .setFooter({ text: "||From: EGO!ST TEAM||" });

        await member.send({ embeds: [welcomeEmbed] });
    } catch (error) {
        console.error(`Failed to send welcome message to ${member.user.tag}: ${error}`);
    }

    // Track invite
    try {
        const newInvites = await guild.invites.fetch();
        const cachedInvites = inviteCache.get(guild.id) || new Map();
        let inviter = null;
        let usedInvite = null;

        for (const [code, invite] of newInvites) {
            const cachedUses = cachedInvites.get(code) || 0;
            if (invite.uses > cachedUses) {
                inviter = invite.inviter;
                usedInvite = invite;
                break;
            }
        }

        if (inviter && usedInvite) {
            const inviteEmbed = new EmbedBuilder()
                .setTitle("New Member Joined!")
                .setDescription(`${member.user.tag} joined using invite **${usedInvite.code}** created by ${inviter.tag} (Uses: ${usedInvite.uses})`)
                .setColor("#00FF00")
                .setTimestamp();

            if (inviteLogChannel) await inviteLogChannel.send({ embeds: [inviteEmbed] });

            // Update the invite cache
            const updatedInvites = new Map();
            newInvites.forEach(invite => updatedInvites.set(invite.code, invite.uses));
            inviteCache.set(guild.id, updatedInvites);
        } else {
            console.log(`Could not determine inviter for ${member.user.tag}`);
            if (inviteLogChannel) await inviteLogChannel.send(`Unable to track invite for ${member.user.tag}.`);
        }
    } catch (error) {
        console.error(`Failed to track invite for ${member.user.tag}: ${error}`);
        if (inviteLogChannel) await inviteLogChannel.send(`Error tracking invite for ${member.user.tag}: ${error.message}`);
    }
});

// Kick message handler
client.on("guildMemberRemove", async (member) => {
    try {
        const auditLogs = await member.guild.fetchAuditLogs({ type: 20, limit: 1 }); // 20 = Member Kick
        const kickLog = auditLogs.entries.first();
        if (kickLog && kickLog.target.id === member.id && (Date.now() - kickLog.createdTimestamp) < 5000) {
            const kickEmbed = new EmbedBuilder()
                .setTitle("Member Kicked")
                .setDescription(`⚠️ Hi ${member.user.username}, you have been removed from ${member.guild.name}.\nIf you believe this was a mistake or need clarification, please contact a server admin.`)
                .setColor("#FF0000")
                .setTimestamp();

            await member.send({ embeds: [kickEmbed] });
        }
    } catch (error) {
        console.error(`Failed to send kick message to ${member.user.tag}: ${error}`);
    }
});

// Ban message handler
client.on("guildBanAdd", async (ban) => {
    try {
        const banChannel = ban.guild.channels.cache.get('1324009867018633296');
        if (banChannel) {
            const banEmbed = new EmbedBuilder()
                .setTitle("Member Banned")
                .setDescription(`⚠️ ${ban.user.username} has been banned from ${ban.guild.name}.`)
                .setColor("#FF0000")
                .setTimestamp();

            await banChannel.send({ embeds: [banEmbed] });
        }
        const banDMEmbed = new EmbedBuilder()
            .setTitle("You’ve Been Banned")
            .setDescription(`⚠️ Hi ${ban.user.username}, you have been banned from ${ban.guild.name}. If you believe this was a mistake or need clarification, please contact a server admin.`)
            .setColor("#FF0000")
            .setTimestamp();
        await ban.user.send({ embeds: [banDMEmbed] });
    } catch (error) {
        console.error(`Failed to handle ban for ${ban.user.tag}: ${error}`);
    }
});

client.on("interactionCreate", async (interaction) => {
    console.log(`Interaction received: ${interaction.type}, Command: ${interaction.commandName || interaction.customId}`);
    if (interaction.isCommand()) {
        const { commandName, options } = interaction;

        if (commandName === "giveaway") {
            await interaction.deferReply({ ephemeral: true });
            const subcommand = options.getSubcommand();
            if (subcommand === "create") {
                try {
                    const prize = options.getString("prize");
                    const winners = options.getInteger("winners");
                    const durationStr = options.getString("duration");
                    const startTime = options.getString("start") || null;
                    const embedColor = options.getString("color") || "#00FF00";

                    const durationMatch = durationStr.match(/^(\d+)([smhd])$/i);
                    if (!durationMatch) throw new Error("Invalid duration format! Use e.g., 1h, 30m, 1d.");
                    const [_, value, unit] = durationMatch;
                    const duration = value * { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }[unit.toLowerCase()];

                    const start = startTime ? new Date(startTime) : new Date();
                    if (startTime && isNaN(start)) throw new Error("Invalid start time format! Use YYYY-MM-DD HH:MM PST.");
                    const endTime = new Date(start.getTime() + duration);

                    const embed = new EmbedBuilder()
                        .setTitle("🎉 Giveaway!")
                        .setDescription(`**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R>`)
                        .setColor(embedColor)
                        .setTimestamp();

                    const message = await interaction.channel.send({ embeds: [embed], components: [joinButton] });
                    giveaways.set(message.id, { channelId: interaction.channel.id, prize, winners, duration, endTime, participants: new Set(), embedColor });

                    await interaction.editReply({ content: "Giveaway created!" });
                    setTimeout(() => endGiveaway(message.id), endTime - Date.now());
                } catch (error) {
                    await interaction.editReply({ content: `Error: ${error.message}` });
                }
            } else if (subcommand === "end") {
                try {
                    const messageId = options.getString("messageid");
                    if (!giveaways.has(messageId)) throw new Error("Invalid giveaway message ID!");
                    await endGiveaway(messageId);
                    await interaction.editReply({ content: "Giveaway ended!" });
                } catch (error) {
                    await interaction.editReply({ content: `Error: ${error.message}` });
                }
            }
        } else if (commandName === "reactionrole") {
            await interaction.deferReply({ ephemeral: true });
            try {
                const role = options.getRole("role");
                const emojiInput = options.getString("emoji");
                const reactionChannel = interaction.guild.channels.cache.get(REACTION_ROLE_CHANNEL_ID);

                if (!reactionChannel) throw new Error("Reaction role channel (1324009841504550966) not found!");

                const selectedEmojis = emojiInput.split(",").map(e => e.trim());
                if (selectedEmojis.length === 0) throw new Error("No valid emojis provided!");

                console.log(`Setting up reaction role with emojis: ${selectedEmojis.join(", ")}`);

                const embed = new EmbedBuilder()
                    .setTitle("🎉 Welcome to EGO!ST ROLEPLAY!")
                    .setDescription(
                        `✨ To join the fun and explore the server, you'll need to verify yourself. It's quick and easy!\n\n🔒React with this emoji to verify!\n ${selectedEmojis.join("")}\n\n🔓 Once verified, the gates to the server will swing open, unlocking all the channels for you to enjoy.\n🎉 Welcome to EGO!ST ROLEPLAY!`
                    )
                    .setThumbnail("https://files.fivemerr.com/images/032724f7-dc90-49e7-bd22-ceed86da33f8.png")
                    .setImage("https://files.fivemerr.com/images/2379d69b-4893-49c9-9b75-e0f3895ae966.png")
                    .setColor("#FF00FF") // Purple color
                    .setTimestamp();

                const message = await reactionChannel.send({ embeds: [embed] });

                for (const emoji of selectedEmojis) {
                    try {
                        await message.react(emoji);
                        console.log(`Bot reacted with ${emoji}`);
                    } catch (error) {
                        console.error(`Failed to react with ${emoji}: ${error}`);
                    }
                }

                reactionRoles.set(message.id, { roleId: role.id, emoji: selectedEmojis });
                await interaction.editReply({
                    content: `Verification reaction role set up in <#${REACTION_ROLE_CHANNEL_ID}> for ${role.name} with ${selectedEmojis.join(", ")}!`,
                });
            } catch (error) {
                console.error(`Reaction role setup failed: ${error}`);
                await interaction.editReply({ content: `Error: ${error.message}` });
            }
        } else if (commandName === "ticket") {
            await interaction.deferReply({ ephemeral: true });
            try {
                console.log(`Creating ticket for ${interaction.user.tag}`);
                const staffRole = interaction.guild.roles.cache.find(r => r.name === "Staff");

                const permissions = [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] }
                ];

                if (staffRole) {
                    permissions.push({
                        id: staffRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    });
                }

                const ticketChannel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.username}`,
                    type: 0,
                    permissionOverwrites: permissions,
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setTitle("Support Ticket")
                    .setDescription("Welcome to your ticket! Staff will assist you shortly. Use `/close` or the button below.")
                    .setTimestamp();

                const message = await ticketChannel.send({ embeds: [welcomeEmbed], components: [closeButton] });
                tickets.set(ticketChannel.id, { creatorId: interaction.user.id, staffRequest: false, creatorRequest: false, messageId: message.id });

                const timeout = setTimeout(() => autoCloseTicket(ticketChannel), INACTIVITY_TIMEOUT);
                tickets.get(ticketChannel.id).timeout = timeout;

                const notifyChannel = interaction.guild.channels.cache.get(NOTIFICATION_CHANNEL_ID);
                if (notifyChannel) await notifyChannel.send(`New ticket: ${ticketChannel}`);

                await interaction.editReply({ content: `Ticket created! Go to ${ticketChannel}` });
            } catch (error) {
                console.error(`Ticket creation failed: ${error}`);
                await interaction.editReply({ content: `Failed to create ticket: ${error.message}. Check bot permissions or contact an admin.` });
            }
        } else if (commandName === "close") {
            await interaction.deferReply({ ephemeral: true });
            try {
                const channel = interaction.channel;
                const ticket = tickets.get(channel.id);
                const reason = options.getString("reason") || "No reason provided";

                if (!ticket) throw new Error("This is not a ticket channel!");

                const isStaff = interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels);
                if (isStaff && !ticket.staffRequest) {
                    ticket.staffRequest = true;
                    const embed = new EmbedBuilder()
                        .setTitle("Close Request")
                        .setDescription(`Staff requested to close this ticket.\nReason: ${reason}\nCreator, please confirm.`)
                        .setTimestamp();
                    await channel.send({ embeds: [embed], components: [confirmButtons] });
                    await interaction.editReply({ content: "Close request sent." });
                } else if (interaction.user.id === ticket.creatorId && !ticket.creatorRequest) {
                    ticket.creatorRequest = true;
                    const embed = new EmbedBuilder()
                        .setTitle("Close Request")
                        .setDescription(`Creator requested to close this ticket.\nReason: ${reason}\nStaff, please confirm.`)
                        .setTimestamp();
                    await channel.send({ embeds: [embed], components: [confirmButtons] });
                    await interaction.editReply({ content: "Close request sent." });
                } else {
                    await interaction.editReply({ content: "A close request is already pending!" });
                }
            } catch (error) {
                await interaction.editReply({ content: `Error: ${error.message}` });
            }
        } else if (commandName === "force-close") {
            await interaction.deferReply({ ephemeral: true });
            try {
                const channel = interaction.channel;
                const ticket = tickets.get(channel.id);
                const reason = options.getString("reason") || "No reason provided";

                if (!ticket) throw new Error("This is not a ticket channel!");
                await closeTicket(channel, reason, interaction.user);
                await interaction.editReply({ content: "Ticket force-closed." });
            } catch (error) {
                await interaction.editReply({ content: `Error: ${error.message}` });
            }
        } else if (commandName === "thread-ticket") {
            await interaction.deferReply({ ephemeral: true });
            try {
                const thread = await interaction.channel.threads.create({
                    name: `ticket-${interaction.user.username}`,
                    autoArchiveDuration: 60,
                    type: 11,
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setTitle("Support Ticket (Thread)")
                    .setDescription("Welcome to your ticket! Staff will assist you shortly. Use `/close` or the button.")
                    .setTimestamp();

                const message = await thread.send({ embeds: [welcomeEmbed], components: [closeButton] });
                tickets.set(thread.id, { creatorId: interaction.user.id, staffRequest: false, creatorRequest: false, messageId: message.id, isThread: true });

                const timeout = setTimeout(() => autoCloseTicket(thread), INACTIVITY_TIMEOUT);
                tickets.get(thread.id).timeout = timeout;

                await interaction.editReply({ content: `Thread ticket created: ${thread}` });
            } catch (error) {
                await interaction.editReply({ content: `Error: ${error.message}` });
            }
        } else if (commandName === "close-all") {
            await interaction.deferReply({ ephemeral: true });
            try {
                const categoryId = options.getString("category");
                const channels = interaction.guild.channels.cache.filter(c => c.parentId === categoryId && tickets.has(c.id));

                for (const channel of channels.values()) {
                    await closeTicket(channel, "Closed via /close-all", interaction.user);
                }
                await interaction.editReply({ content: `Closed ${channels.size} tickets in category ${categoryId}.` });
            } catch (error) {
                await interaction.editReply({ content: `Error: ${error.message}` });
            }
        }
    } else if (interaction.isButton()) {
        const ticket = tickets.get(interaction.channel.id);
        if (interaction.customId === "join_giveaway") {
            await interaction.deferReply({ ephemeral: true });
            try {
                const giveaway = giveaways.get(interaction.message.id);
                if (!giveaway) throw new Error("This giveaway no longer exists!");
                if (giveaway.endTime < Date.now()) throw new Error("This giveaway has ended!");

                giveaway.participants.add(interaction.user.id);
                await interaction.editReply({ content: "You’ve joined the giveaway!" });
            } catch (error) {
                await interaction.editReply({ content: `Error: ${error.message}` });
            }
        } else if (ticket && interaction.customId === "close_ticket") {
            const embed = new EmbedBuilder()
                .setTitle("Close Confirmation")
                .setDescription("Are you sure you want to close this ticket?")
                .setTimestamp();
            await interaction.reply({ embeds: [embed], components: [confirmButtons], ephemeral: true });
        } else if (ticket && interaction.customId === "confirm_close") {
            await interaction.deferReply({ ephemeral: true });
            try {
                const isStaff = interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels);
                if (ticket.staffRequest && interaction.user.id === ticket.creatorId) {
                    await closeTicket(interaction.channel, "Closed by creator confirmation", interaction.user);
                } else if (ticket.creatorRequest && isStaff) {
                    await closeTicket(interaction.channel, "Closed by staff confirmation", interaction.user);
                } else if (!ticket.staffRequest && !ticket.creatorRequest) {
                    await closeTicket(interaction.channel, "Closed via button", interaction.user);
                } else {
                    throw new Error("You cannot confirm this close request!");
                }
                await interaction.editReply({ content: "Ticket closed." });
            } catch (error) {
                await interaction.editReply({ content: `Error: ${error.message}` });
            }
        } else if (ticket && interaction.customId === "cancel_close") {
            await interaction.deferReply({ ephemeral: true });
            ticket.staffRequest = false;
            ticket.creatorRequest = false;
            await interaction.editReply({ content: "Close request canceled." });
        }
    } else if (interaction.commandName === "birthday") {
        if (interaction.options.getSubcommand() === "set") {
            const day = interaction.options.getInteger("day");
            const month = interaction.options.getInteger("month");
            const year = interaction.options.getInteger("year");

            birthdays.set(interaction.user.id, { day, month, year });

            const embed = new EmbedBuilder()
                .setTitle("Birthday Set!")
                .setDescription(`Your birthday has been set to: ${day}/${month}${year ? `/${year}` : ''}`)
                .setColor("#f45142")
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
});

client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;

    const messageId = reaction.message.id;
    const roleData = reactionRoles.get(messageId);
    if (!roleData || !roleData.emoji.includes(reaction.emoji.name)) return;

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);

    // Toggle role: Add if not present, remove if present
    const hasRole = member.roles.cache.has(VERIFICATION_ROLE_ID);
    if (!hasRole) {
        await member.roles.add(VERIFICATION_ROLE_ID);
        console.log(`Added role ${VERIFICATION_ROLE_ID} to ${user.tag}`);

        // Send verification complete message only
        try {
            await user.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Verification Complete!")
                        .setDescription("You have been successfully verified in EGO!ST ROLEPLAY. Welcome to the community!")
                        .setColor("#FF00FF")
                        .setFooter({ text: "||From: EGO!ST TEAM||" }),
                ],
            });
        } catch (error) {
            console.error(`Failed to send verification DM to ${user.tag}: ${error}`);
        }
    } else {
        await member.roles.remove(VERIFICATION_ROLE_ID);
        console.log(`Removed role ${VERIFICATION_ROLE_ID} from ${user.tag}`);
    }

    // Remove the user's reaction to reset the emoji
    try {
        await reaction.users.remove(user.id);
        console.log(`Removed reaction ${reaction.emoji.name} from ${user.tag}`);
    } catch (error) {
        console.error(`Failed to remove reaction from ${user.tag}: ${error}`);
    }
});

client.on("messageReactionRemove", async (reaction, user) => {
    // No action needed here since we remove the reaction in messageReactionAdd
});

async function endGiveaway(messageId) {
    const giveaway = giveaways.get(messageId);
    if (!giveaway) return;

    const channel = client.channels.cache.get(giveaway.channelId);
    if (!channel) return;

    const participants = Array.from(giveaway.participants);
    const winners = participants.sort(() => 0.5 - Math.random()).slice(0, giveaway.winners);
    const winnerMentions = winners.map(id => `<@${id}>`).join(", ") || "No one entered!";

    const embed = new EmbedBuilder()
        .setTitle("🎉 Giveaway Ended!")
        .setDescription(`**Prize:** ${giveaway.prize}\n**Winners:** ${winnerMentions}`)
        .setColor(giveaway.embedColor)
        .setTimestamp();

    await channel.send({ embeds: [embed] });
    giveaways.delete(messageId);

    const message = await channel.messages.fetch(messageId);
    await message.edit({ components: [] });
}

async function autoCloseTicket(channel) {
    const ticket = tickets.get(channel.id);
    if (!ticket) return;

    const embed = new EmbedBuilder()
        .setTitle("Ticket Auto-Closed")
        .setDescription("This ticket has been inactive for too long and was automatically closed.")
        .setTimestamp();
    await channel.send({ embeds: [embed] });
    await closeTicket(channel, "Auto-closed due to inactivity");
}

async function closeTicket(channel, reason, user = null) {
    const ticket = tickets.get(channel.id);
    if (!ticket) return;

    clearTimeout(ticket.timeout);
    tickets.delete(channel.id);

    const messages = await channel.messages.fetch();
    let transcript = `Ticket Transcript - #${channel.name}\n`;
    transcript += `Created by: <@${ticket.creatorId}>\n`;
    transcript += `Closed by: ${user ? user.tag : "System"}\n`;
    transcript += `Reason: ${reason}\n\n`;

    messages.reverse().forEach(msg => {
        transcript += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content}\n`;
    });

    const transcriptChannel = channel.guild.channels.cache.get(TRANSCRIPT_CHANNEL_ID);
    if (transcriptChannel) {
        const transcriptEmbed = new EmbedBuilder()
            .setTitle(`Ticket Transcript - #${channel.name}`)
            .setDescription(`Transcript for ticket ${channel.name}`)
            .addFields(
                { name: "Createdby", value: `<@${ticket.creatorId}>` },
                { name: "Closed by", value: user ? user.tag : "System" },
                { name: "Reason", value: reason }
            )
            .setColor("#00FF00")
            .setTimestamp();

        await transcriptChannel.send({
            embeds: [transcriptEmbed],
            files: [{
                attachment: Buffer.from(transcript),
                name: `transcript-${channel.name}.txt`
            }]
        });
    }

    const embed = new EmbedBuilder()
        .setTitle("Ticket Closed")
        .setDescription(`Reason: ${reason}\nClosed by: ${user ? user.tag : "System"}\nTranscript saved.`)
        .setTimestamp();
    await channel.send({ embeds: [embed] });
    if (ticket.isThread) await channel.delete();
    else await channel.delete();
}

client.login(Token);
