const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const PREFIX = ";";
const ADMIN_ROLE = "Admin";
const MOD_ROLE = "Moderator";
const LOG_CHANNEL = "staff-logs";

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// ===== DISCORD READY =====
client.once('ready', () => {
    console.log(`✅ ERLC Bot Online as ${client.user.tag}`);
});

// ===== DASHBOARD ROUTE =====
app.get("/", (req, res) => {
    res.render("dashboard");
});

// ===== COMMAND EXECUTION FROM WEB =====
app.post("/command", async (req, res) => {
    const { command, target, executor } = req.body;

    const guild = client.guilds.cache.first();
    const logChannel = guild.channels.cache.find(c => c.name === LOG_CHANNEL);
    const caseID = uuidv4().slice(0, 8);

    const embed = new EmbedBuilder()
        .setTitle("🌐 DASHBOARD COMMAND")
        .setDescription(`
**Command:** ${command}
**Target:** ${target}
**Executed By:** ${executor}
**Case ID:** ${caseID}
        `)
        .setColor("Blue")
        .setTimestamp();

    if (logChannel) logChannel.send({ embeds: [embed] });

    res.redirect("/");
});

// ===== EXPANDED COMMAND SYSTEM =====
client.on('messageCreate', async message => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const isAdmin = message.member.roles.cache.some(r => r.name === ADMIN_ROLE);
    const isMod = message.member.roles.cache.some(r => r.name === MOD_ROLE);

    const logChannel = message.guild.channels.cache.find(c => c.name === LOG_CHANNEL);

    function log(title, desc, color) {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(desc)
            .setColor(color)
            .setTimestamp();

        if (logChannel) logChannel.send({ embeds: [embed] });
    }

    // ===== ADMIN TOOLS =====
    if (["fly","bring","goto","freeze","unfreeze","heal","revive","tp"].includes(command)) {
        if (!isAdmin && !isMod)
            return message.reply("No permission.");

        const target = args[0] || "Unknown";
        const caseID = uuidv4().slice(0, 8);

        log(
            "🛠️ ERLC ADMIN TOOL",
            `Command: ${command}\nTarget: ${target}\nBy: ${message.author}\nCase ID: ${caseID}`,
            "Blue"
        );

        return message.reply(`Logged ${command}.`);
    }

    if (command === "ban") {
        if (!isAdmin) return message.reply("Admin only.");
        const target = args[0];
        const caseID = uuidv4().slice(0, 8);

        log(
            "⛔ ERLC BAN",
            `Target: ${target}\nBy: ${message.author}\nCase ID: ${caseID}`,
            "Red"
        );

        return message.reply("Ban logged.");
    }

    if (command === "kick") {
        if (!isAdmin) return message.reply("Admin only.");
        const target = args[0];
        const caseID = uuidv4().slice(0, 8);

        log(
            "🔨 ERLC KICK",
            `Target: ${target}\nBy: ${message.author}\nCase ID: ${caseID}`,
            "Orange"
        );

        return message.reply("Kick logged.");
    }

});

client.login(process.env.TOKEN);

// ===== START WEB SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Dashboard running on port ${PORT}`));
