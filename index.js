const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType
} = require('discord.js');

const translate = require('google-translate-api-x');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1483310634463531008";
const GUILD_ID = "1319628794494976021";

const TARGET_CHANNEL = "1483225606035603497";
const LOG_CHANNEL = "1414367926068183221";
const TIMEOUT_DURATION = 24 * 60 * 60 * 1000; // 24 giờ

const ALLOWED_USER_ID = "920665592854360075";

// Nội quy
const RULES_CHANNEL_ID = "1319630292369145856";
const RULES_MESSAGE_ID = "1460224786398707714";

// Hướng dẫn
const GUIDE_CHANNEL_ID = "1319630292369145856";
const GUIDE_MESSAGE_ID = "1439956896424394843";
// =========================================

function buildMessageLink(channelId, messageId) {
  return `https://discord.com/channels/${GUILD_ID}/${channelId}/${messageId}`;
}

const RULES_MESSAGE_URL = buildMessageLink(RULES_CHANNEL_ID, RULES_MESSAGE_ID);
const GUIDE_MESSAGE_URL = buildMessageLink(GUIDE_CHANNEL_ID, GUIDE_MESSAGE_ID);

// ===== Slash commands =====
const commands = [
  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Bot nói lại nội dung bạn nhập")
    .addStringOption(option =>
      option.setName("text").setDescription("Nội dung muốn bot nói").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Cảnh cáo user qua DM và ghi log")
    .addUserOption(option =>
      option.setName("user").setDescription("User cần cảnh cáo").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Lý do cảnh cáo").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout một user theo phút")
    .addUserOption(option =>
      option.setName("user").setDescription("User cần timeout").setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("minutes")
        .setDescription("Số phút timeout")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Lý do timeout").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Gỡ timeout cho một user")
    .addUserOption(option =>
      option.setName("user").setDescription("User cần gỡ timeout").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Lý do gỡ timeout").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Khóa kênh hiện tại"),

  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Mở khóa kênh hiện tại"),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban một user")
    .addUserOption(option =>
      option.setName("user").setDescription("User cần ban").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Lý do ban").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Gỡ ban bằng ID user")
    .addStringOption(option =>
      option.setName("userid").setDescription("ID user cần unban").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Lý do unban").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick một user")
    .addUserOption(option =>
      option.setName("user").setDescription("User cần kick").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Lý do kick").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Xóa tin nhắn trong kênh hoặc theo user")
    .addStringOption(option =>
      option
        .setName("mode")
        .setDescription("Xóa theo kênh hoặc theo user")
        .setRequired(true)
        .addChoices(
          { name: "channel", value: "channel" },
          { name: "user", value: "user" }
        )
    )
    .addStringOption(option =>
      option
        .setName("scope")
        .setDescription("Xóa toàn bộ gần đây hoặc theo số lượng")
        .setRequired(true)
        .addChoices(
          { name: "all", value: "all" },
          { name: "amount", value: "amount" }
        )
    )
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Số lượng cần xóa nếu chọn amount")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Chọn user nếu mode = user")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Xem thông tin hồ sơ cơ bản của user")
    .addUserOption(option =>
      option.setName("user").setDescription("User cần xem").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("noiquy")
    .setDescription("Gửi link nội quy"),

  new SlashCommandBuilder()
    .setName("huongdan")
    .setDescription("Gửi link hướng dẫn cho người mới"),

  new SlashCommandBuilder()
    .setName("calc")
    .setDescription("Tính cộng trừ nhân chia, ^ và %")
    .addStringOption(option =>
      option.setName("bieuthuc").setDescription("Ví dụ: 10+20, 5^2, 50%, (10+5)*2").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("dich")
    .setDescription("Dịch Anh-Việt hoặc Việt-Anh")
    .addStringOption(option =>
      option
        .setName("huong")
        .setDescription("Hướng dịch")
        .setRequired(true)
        .addChoices(
          { name: "en-vi", value: "en-vi" },
          { name: "vi-en", value: "vi-en" }
        )
    )
    .addStringOption(option =>
      option.setName("text").setDescription("Nội dung cần dịch").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Kiểm tra độ trễ bot"),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Xem danh sách lệnh"),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Xem thông tin server"),

  new SlashCommandBuilder()
    .setName("report")
    .setDescription("Báo cáo một user")
    .addUserOption(option =>
      option.setName("user").setDescription("User bị báo cáo").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason").setDescription("Lý do báo cáo").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Gửi góp ý")
    .addStringOption(option =>
      option.setName("text").setDescription("Nội dung góp ý").setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  try {
    console.log("Đang đăng ký slash command...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Đã đăng ký xong slash command.");
  } catch (error) {
    console.error("Lỗi đăng ký slash command:", error);
  }
}

// ===== helper =====
function isAllowedUser(interaction) {
  return interaction.user.id === ALLOWED_USER_ID;
}

function getLogChannel(guild) {
  return guild.channels.cache.get(LOG_CHANNEL);
}

async function sendLog(guild, embed) {
  try {
    const logChannel = getLogChannel(guild);
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error("Lỗi gửi log:", err);
  }
}

function getPermissionLabel(member) {
  if (!member || !member.guild) return "member";
  if (member.guild.ownerId === member.id) return "owner";
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return "admin";

  const moderatorFlags = [
    PermissionsBitField.Flags.ModerateMembers,
    PermissionsBitField.Flags.KickMembers,
    PermissionsBitField.Flags.BanMembers,
    PermissionsBitField.Flags.ManageMessages,
    PermissionsBitField.Flags.ManageChannels,
    PermissionsBitField.Flags.ManageRoles
  ];

  if (moderatorFlags.some(flag => member.permissions.has(flag))) return "moderator";
  return "member";
}

function sanitizeExpression(input) {
  let expr = input.replace(/\s+/g, "");
  if (!/^[0-9+\-*/().%^]+$/.test(expr)) {
    throw new Error("Biểu thức chứa ký tự không hợp lệ.");
  }
  expr = expr.replace(/(\d+(\.\d+)?)%/g, "($1/100)");
  expr = expr.replace(/\^/g, "**");
  return expr;
}

function calculateExpression(input) {
  const expr = sanitizeExpression(input);
  const result = Function(`"use strict"; return (${expr});`)();
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("Không tính được biểu thức này.");
  }
  return result;
}

function truncate(text, max = 1000) {
  if (!text) return "Không có nội dung";
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

async function sendDMToOwnerBot(embed) {
  try {
    const user = await client.users.fetch(ALLOWED_USER_ID, { force: true });
    await user.send({ embeds: [embed] });
    return true;
  } catch (err) {
    console.error("Lỗi gửi DM đến user quản trị:", err);
    return false;
  }
}

async function clearChannelMessages(channel, amount) {
  const deleted = await channel.bulkDelete(amount, true);
  return deleted.size;
}

async function clearUserMessages(channel, userId, scope, amount) {
  let deletedCount = 0;

  if (scope === "amount") {
    const fetched = await channel.messages.fetch({ limit: 100 });
    const targets = fetched
      .filter(msg => msg.author.id === userId)
      .first(amount);

    if (targets.length > 0) {
      const deleted = await channel.bulkDelete(targets, true);
      deletedCount = deleted.size;
    }

    return deletedCount;
  }

  // scope = all: quét nhiều đợt gần đây
  let lastId = null;
  let rounds = 0;

  while (rounds < 10) {
    const fetched = await channel.messages.fetch({
      limit: 100,
      ...(lastId ? { before: lastId } : {})
    });

    if (!fetched.size) break;

    const targets = fetched.filter(msg => msg.author.id === userId);

    if (targets.size > 0) {
      const deleted = await channel.bulkDelete(targets, true);
      deletedCount += deleted.size;
    }

    lastId = fetched.last().id;
    rounds++;
  }

  return deletedCount;
}

// ===== events =====
client.on("clientReady", async () => {
  console.log(`Bot online: ${client.user.tag}`);
  await registerCommands();
});

// Auto timeout khi nhắn vào kênh cấm
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild || !message.member) return;

  if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
  if (message.channel.id !== TARGET_CHANNEL) return;

  try {
    const originalContent = truncate(message.content || "Không có nội dung");
    await message.delete().catch(() => {});
    await message.member.timeout(TIMEOUT_DURATION, "Nhắn vào kênh bị cấm");

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("🚫 User bị mute (timeout)")
      .addFields(
        { name: "👤 User", value: `<@${message.author.id}>`, inline: true },
        { name: "📍 Kênh", value: `<#${TARGET_CHANNEL}>`, inline: true },
        { name: "⏳ Thời gian", value: "24 giờ", inline: true },
        { name: "📨 Nội dung", value: originalContent }
      )
      .setThumbnail(message.author.displayAvatarURL({ size: 1024 }))
      .setFooter({ text: `ID: ${message.author.id}` })
      .setTimestamp();

    await sendLog(message.guild, embed);
  } catch (err) {
    console.error("Lỗi khi timeout user:", err);
  }
});

// Log đổi role / nickname
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    const oldNickname = oldMember.nickname || oldMember.user.username;
    const newNickname = newMember.nickname || newMember.user.username;

    if (oldNickname !== newNickname) {
      const embed = new EmbedBuilder()
        .setColor(0xff99cc)
        .setTitle("✏️ Nickname thay đổi")
        .addFields(
          { name: "👤 User", value: `<@${newMember.id}>`, inline: true },
          { name: "📛 Cũ", value: oldNickname || "Không có", inline: true },
          { name: "🆕 Mới", value: newNickname || "Không có", inline: true }
        )
        .setTimestamp();

      await sendLog(newMember.guild, embed);
    }

    const oldRoles = oldMember.roles.cache
      .filter(role => role.id !== oldMember.guild.id)
      .map(role => role.id);

    const newRoles = newMember.roles.cache
      .filter(role => role.id !== newMember.guild.id)
      .map(role => role.id);

    const addedRoles = newMember.roles.cache.filter(
      role => role.id !== newMember.guild.id && !oldRoles.includes(role.id)
    );

    const removedRoles = oldMember.roles.cache.filter(
      role => role.id !== oldMember.guild.id && !newRoles.includes(role.id)
    );

    if (addedRoles.size > 0 || removedRoles.size > 0) {
      const embed = new EmbedBuilder()
        .setColor(0x9966ff)
        .setTitle("🎖️ Vai trò thay đổi")
        .addFields(
          { name: "👤 User", value: `<@${newMember.id}>`, inline: true },
          {
            name: "➕ Role thêm",
            value: addedRoles.size ? addedRoles.map(r => r.toString()).join(", ") : "Không có",
            inline: false
          },
          {
            name: "➖ Role bỏ",
            value: removedRoles.size ? removedRoles.map(r => r.toString()).join(", ") : "Không có",
            inline: false
          }
        )
        .setTimestamp();

      await sendLog(newMember.guild, embed);
    }
  } catch (err) {
    console.error("Lỗi log guildMemberUpdate:", err);
  }
});

// Slash commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const unrestrictedCommands = ["report", "suggest"];
  const needsOwnerPermission = !unrestrictedCommands.includes(interaction.commandName);

  if (needsOwnerPermission && !isAllowedUser(interaction)) {
    await interaction.reply({
      content: "Bạn không có quyền dùng lệnh này.",
      ephemeral: true
    });
    return;
  }

  try {
    // /say (ẩn)
    if (interaction.commandName === "say") {
      const text = interaction.options.getString("text");
      await interaction.reply({ content: "Đã gửi.", ephemeral: true });
      await interaction.channel.send(text);
      return;
    }

    // /warn (ẩn)
    if (interaction.commandName === "warn") {
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "Không có lý do";

      let dmStatus = "Gửi DM thành công";
      try {
        await user.send(`⚠️ Bạn đã bị cảnh cáo trong server.\nLý do: ${reason}`);
      } catch {
        dmStatus = "Không thể gửi DM cho user này";
      }

      await interaction.reply({
        content: `Đã cảnh cáo ${user.tag}. ${dmStatus}.`,
        ephemeral: true
      });

      const embed = new EmbedBuilder()
        .setColor(0xffcc00)
        .setTitle("⚠️ User bị cảnh cáo")
        .addFields(
          { name: "👤 User", value: `<@${user.id}>`, inline: true },
          { name: "👮 Người warn", value: `<@${interaction.user.id}>`, inline: true },
          { name: "📬 DM", value: dmStatus, inline: true },
          { name: "📝 Lý do", value: truncate(reason) }
        )
        .setTimestamp();

      await sendLog(interaction.guild, embed);
      return;
    }

    // /timeout (public)
    if (interaction.commandName === "timeout") {
      const user = interaction.options.getUser("user");
      const minutes = interaction.options.getInteger("minutes");
      const reason = interaction.options.getString("reason") || "Không có lý do";

      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: "Không tìm thấy member này trong server." });
        return;
      }
      if (!member.moderatable) {
        await interaction.reply({ content: "Không thể timeout user này. Kiểm tra quyền bot và thứ tự role." });
        return;
      }

      await member.timeout(minutes * 60 * 1000, reason);

      await interaction.reply({ content: `Đã timeout ${user.tag} trong ${minutes} phút.` });

      const embed = new EmbedBuilder()
        .setColor(0xff6600)
        .setTitle("⏳ User bị timeout")
        .addFields(
          { name: "👤 User", value: `<@${user.id}>`, inline: true },
          { name: "👮 Người timeout", value: `<@${interaction.user.id}>`, inline: true },
          { name: "⏱️ Thời gian", value: `${minutes} phút`, inline: true },
          { name: "📝 Lý do", value: truncate(reason) }
        )
        .setTimestamp();

      await sendLog(interaction.guild, embed);
      return;
    }

    // /untimeout (public)
    if (interaction.commandName === "untimeout") {
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "Không có lý do";

      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: "Không tìm thấy member này trong server." });
        return;
      }
      if (!member.moderatable) {
        await interaction.reply({ content: "Không thể gỡ timeout user này. Kiểm tra quyền bot và thứ tự role." });
        return;
      }

      await member.timeout(null, reason);

      await interaction.reply({ content: `Đã gỡ timeout cho ${user.tag}.` });

      const embed = new EmbedBuilder()
        .setColor(0x33cc66)
        .setTitle("✅ User được gỡ timeout")
        .addFields(
          { name: "👤 User", value: `<@${user.id}>`, inline: true },
          { name: "👮 Người thực hiện", value: `<@${interaction.user.id}>`, inline: true },
          { name: "📝 Lý do", value: truncate(reason), inline: false }
        )
        .setTimestamp();

      await sendLog(interaction.guild, embed);
      return;
    }

    // /lock (public)
    if (interaction.commandName === "lock") {
      const channel = interaction.channel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply({ content: "Lệnh này chỉ dùng trong kênh text của server." });
        return;
      }

      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false
      });

      await interaction.reply({ content: `Đã khóa kênh ${channel}.` });

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("🔒 Kênh đã bị khóa")
        .addFields(
          { name: "📍 Kênh", value: `${channel}`, inline: true },
          { name: "👮 Người thực hiện", value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();

      await sendLog(interaction.guild, embed);
      return;
    }

    // /unlock (public)
    if (interaction.commandName === "unlock") {
      const channel = interaction.channel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply({ content: "Lệnh này chỉ dùng trong kênh text của server." });
        return;
      }

      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: null
      });

      await interaction.reply({ content: `Đã mở khóa kênh ${channel}.` });

      const embed = new EmbedBuilder()
        .setColor(0x00cc66)
        .setTitle("🔓 Kênh đã được mở khóa")
        .addFields(
          { name: "📍 Kênh", value: `${channel}`, inline: true },
          { name: "👮 Người thực hiện", value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();

      await sendLog(interaction.guild, embed);
      return;
    }

    // /ban (public)
    if (interaction.commandName === "ban") {
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "Không có lý do";

      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (member && !member.bannable) {
        await interaction.reply({ content: "Không thể ban user này. Kiểm tra quyền bot và thứ tự role." });
        return;
      }

      await interaction.guild.members.ban(user.id, { reason });

      await interaction.reply({ content: `Đã ban ${user.tag}.` });

      const embed = new EmbedBuilder()
        .setColor(0x990000)
        .setTitle("🔨 User bị ban")
        .addFields(
          { name: "👤 User", value: `${user.tag} (${user.id})`, inline: false },
          { name: "👮 Người ban", value: `<@${interaction.user.id}>`, inline: true },
          { name: "📝 Lý do", value: truncate(reason), inline: true }
        )
        .setTimestamp();

      await sendLog(interaction.guild, embed);
      return;
    }

    // /unban (public)
    if (interaction.commandName === "unban") {
      const userId = interaction.options.getString("userid");
      const reason = interaction.options.getString("reason") || "Không có lý do";

      await interaction.guild.members.unban(userId, reason);

      await interaction.reply({ content: `Đã unban user ID ${userId}.` });

      const embed = new EmbedBuilder()
        .setColor(0x66ccff)
        .setTitle("🔓 User được unban")
        .addFields(
          { name: "🆔 User ID", value: userId, inline: true },
          { name: "👮 Người unban", value: `<@${interaction.user.id}>`, inline: true },
          { name: "📝 Lý do", value: truncate(reason), inline: false }
        )
        .setTimestamp();

      await sendLog(interaction.guild, embed);
      return;
    }

    // /kick (public)
    if (interaction.commandName === "kick") {
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "Không có lý do";

      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: "Không tìm thấy member này trong server." });
        return;
      }
      if (!member.kickable) {
        await interaction.reply({ content: "Không thể kick user này. Kiểm tra quyền bot và thứ tự role." });
        return;
      }

      await member.kick(reason);

      await interaction.reply({ content: `Đã kick ${user.tag}.` });

      const embed = new EmbedBuilder()
        .setColor(0xcc3300)
        .setTitle("👢 User bị kick")
        .addFields(
          { name: "👤 User", value: `${user.tag} (${user.id})`, inline: false },
          { name: "👮 Người kick", value: `<@${interaction.user.id}>`, inline: true },
          { name: "📝 Lý do", value: truncate(reason), inline: true }
        )
        .setTimestamp();

      await sendLog(interaction.guild, embed);
      return;
    }

    // /clear (public)
    if (interaction.commandName === "clear") {
      const channel = interaction.channel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply({ content: "Lệnh này chỉ dùng trong kênh text của server." });
        return;
      }

      const mode = interaction.options.getString("mode");
      const scope = interaction.options.getString("scope");
      const amount = interaction.options.getInteger("amount");
      const targetUser = interaction.options.getUser("user");

      if (mode === "channel") {
        if (scope === "amount") {
          if (!amount) {
            await interaction.reply({ content: "Bạn phải nhập amount khi chọn scope = amount." });
            return;
          }

          const deletedCount = await clearChannelMessages(channel, amount);

          await interaction.reply({ content: `Đã xóa ${deletedCount} tin nhắn trong ${channel}.` });

          const embed = new EmbedBuilder()
            .setColor(0x95a5a6)
            .setTitle("🧹 Dọn tin nhắn theo kênh")
            .addFields(
              { name: "📍 Kênh", value: `${channel}`, inline: true },
              { name: "🔢 Số tin đã xóa", value: String(deletedCount), inline: true },
              { name: "👮 Người thực hiện", value: `<@${interaction.user.id}>`, inline: true }
            )
            .setTimestamp();

          await sendLog(interaction.guild, embed);
          return;
        }

        if (scope === "all") {
          let totalDeleted = 0;
          for (let i = 0; i < 10; i++) {
            const deletedCount = await clearChannelMessages(channel, 100);
            totalDeleted += deletedCount;
            if (deletedCount < 2) break;
          }

          await interaction.reply({ content: `Đã xóa ${totalDeleted} tin nhắn gần đây trong ${channel}.` });

          const embed = new EmbedBuilder()
            .setColor(0x95a5a6)
            .setTitle("🧹 Dọn toàn bộ kênh gần đây")
            .addFields(
              { name: "📍 Kênh", value: `${channel}`, inline: true },
              { name: "🔢 Số tin đã xóa", value: String(totalDeleted), inline: true },
              { name: "👮 Người thực hiện", value: `<@${interaction.user.id}>`, inline: true }
            )
            .setTimestamp();

          await sendLog(interaction.guild, embed);
          return;
        }
      }

      if (mode === "user") {
        if (!targetUser) {
          await interaction.reply({ content: "Bạn phải chọn user khi mode = user." });
          return;
        }

        if (scope === "amount") {
          if (!amount) {
            await interaction.reply({ content: "Bạn phải nhập amount khi chọn scope = amount." });
            return;
          }

          const deletedCount = await clearUserMessages(channel, targetUser.id, "amount", amount);

          await interaction.reply({
            content: `Đã xóa ${deletedCount} tin nhắn của ${targetUser.tag} trong ${channel}.`
          });

          const embed = new EmbedBuilder()
            .setColor(0x7f8c8d)
            .setTitle("🧹 Dọn tin theo user")
            .addFields(
              { name: "📍 Kênh", value: `${channel}`, inline: true },
              { name: "👤 User", value: `<@${targetUser.id}>`, inline: true },
              { name: "🔢 Số tin đã xóa", value: String(deletedCount), inline: true },
              { name: "👮 Người thực hiện", value: `<@${interaction.user.id}>`, inline: true }
            )
            .setTimestamp();

          await sendLog(interaction.guild, embed);
          return;
        }

        if (scope === "all") {
          const deletedCount = await clearUserMessages(channel, targetUser.id, "all");

          await interaction.reply({
            content: `Đã xóa ${deletedCount} tin nhắn gần đây của ${targetUser.tag} trong ${channel}.`
          });

          const embed = new EmbedBuilder()
            .setColor(0x7f8c8d)
            .setTitle("🧹 Dọn toàn bộ tin gần đây theo user")
            .addFields(
              { name: "📍 Kênh", value: `${channel}`, inline: true },
              { name: "👤 User", value: `<@${targetUser.id}>`, inline: true },
              { name: "🔢 Số tin đã xóa", value: String(deletedCount), inline: true },
              { name: "👮 Người thực hiện", value: `<@${interaction.user.id}>`, inline: true }
            )
            .setTimestamp();

          await sendLog(interaction.guild, embed);
          return;
        }
      }

      await interaction.reply({ content: "Tùy chọn clear không hợp lệ." });
      return;
    }

    // /avatar (public)
    if (interaction.commandName === "avatar") {
      const user = interaction.options.getUser("user");
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      const freshUser = await client.users.fetch(user.id, { force: true }).catch(() => user);

      const avatarUrl = freshUser.displayAvatarURL({ size: 1024, extension: "png" });
      const bannerUrl =
        (member && member.displayBannerURL?.({ size: 1024, extension: "png" })) ||
        freshUser.bannerURL?.({ size: 1024, extension: "png" }) ||
        "Không có banner";

      const mentionName = `<@${freshUser.id}>`;

      let rolesText = "Không có vai trò";
      let permissionText = "member";

      if (member) {
        const roleNames = member.roles.cache
          .filter(role => role.id !== interaction.guild.id)
          .sort((a, b) => b.position - a.position)
          .map(role => role.toString());

        rolesText = roleNames.length ? truncate(roleNames.join(", "), 1000) : "Không có vai trò";
        permissionText = getPermissionLabel(member);
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🪪 Thông tin user")
        .setThumbnail(avatarUrl)
        .addFields(
          { name: "👤 Tên @", value: mentionName, inline: true },
          { name: "🆔 ID", value: freshUser.id, inline: true },
          { name: "🏷️ Tag", value: freshUser.tag, inline: true },
          { name: "🖼️ Avatar", value: `[Xem avatar](${avatarUrl})`, inline: true },
          {
            name: "🎏 Banner",
            value: bannerUrl === "Không có banner" ? "Không có banner" : `[Xem banner](${bannerUrl})`,
            inline: true
          },
          { name: "📝 Tiểu sử hồ sơ", value: "A project in progress, with some features still under development", inline: false },
          { name: "🎖️ Vai trò", value: rolesText, inline: false },
          { name: "🛡️ Quyền", value: permissionText, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // /noiquy (ẩn)
    if (interaction.commandName === "noiquy") {
      await interaction.reply({ content: `📜 Nội quy: ${RULES_MESSAGE_URL}`, ephemeral: true });
      return;
    }

    // /huongdan (ẩn)
    if (interaction.commandName === "huongdan") {
      await interaction.reply({ content: `📘 Hướng dẫn cho người mới: ${GUIDE_MESSAGE_URL}`, ephemeral: true });
      return;
    }

    // /calc (public)
    if (interaction.commandName === "calc") {
      const expr = interaction.options.getString("bieuthuc");
      try {
        const result = calculateExpression(expr);
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x00cc99)
              .setTitle("🧮 Kết quả tính toán")
              .addFields(
                { name: "Biểu thức", value: `\`${expr}\`` },
                { name: "Kết quả", value: `\`${result}\`` }
              )
              .setTimestamp()
          ]
        });
      } catch (err) {
        await interaction.reply({ content: `Biểu thức không hợp lệ: ${err.message}` });
      }
      return;
    }

    // /dich (public)
    if (interaction.commandName === "dich") {
      const direction = interaction.options.getString("huong");
      const text = interaction.options.getString("text");
      const from = direction === "en-vi" ? "en" : "vi";
      const to = direction === "en-vi" ? "vi" : "en";

      try {
        const res = await translate(text, { from, to });
        const embed = new EmbedBuilder()
          .setColor(0x3399ff)
          .setTitle("🌐 Dịch ngôn ngữ")
          .addFields(
            { name: "Hướng dịch", value: `${from} → ${to}`, inline: true },
            { name: "Văn bản gốc", value: truncate(text) },
            { name: "Kết quả", value: truncate(res.text || "Không có kết quả") }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } catch (err) {
        console.error("Lỗi dịch:", err);
        await interaction.reply({
          content: "Dịch thất bại. Có thể dịch vụ dịch đang lỗi hoặc bị chặn tạm thời."
        });
      }
      return;
    }

    // /ping (public)
    if (interaction.commandName === "ping") {
      const wsPing = client.ws.ping;
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00bfff)
            .setTitle("🏓 Pong")
            .addFields({ name: "Độ trễ WebSocket", value: `${wsPing}ms`, inline: true })
            .setTimestamp()
        ]
      });
      return;
    }

    // /help (public)
    if (interaction.commandName === "help") {
      const embed = new EmbedBuilder()
        .setColor(0x7289da)
        .setTitle("📚 Danh sách lệnh")
        .setDescription([
          "`/say` bot nói lại nội dung",
          "`/warn` cảnh cáo qua DM",
          "`/timeout` timeout user",
          "`/untimeout` gỡ timeout",
          "`/lock` khóa kênh hiện tại",
          "`/unlock` mở khóa kênh hiện tại",
          "`/ban` ban user",
          "`/unban` gỡ ban bằng ID",
          "`/kick` kick user",
          "`/clear` xóa tin theo kênh hoặc user",
          "`/avatar` xem thông tin user",
          "`/noiquy` gửi link nội quy",
          "`/huongdan` gửi link hướng dẫn",
          "`/calc` tính toán đơn giản",
          "`/dich` dịch Anh-Việt / Việt-Anh",
          "`/ping` kiểm tra độ trễ",
          "`/serverinfo` thông tin server",
          "`/report` gửi báo cáo tới quản trị",
          "`/suggest` gửi góp ý tới quản trị"
        ].join("\n"))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // /serverinfo (public)
    if (interaction.commandName === "serverinfo") {
      const guild = interaction.guild;
      await guild.fetch();

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("🖥️ Thông tin server")
        .setThumbnail(guild.iconURL({ size: 1024 }))
        .addFields(
          { name: "📛 Tên server", value: guild.name, inline: true },
          { name: "🆔 Server ID", value: guild.id, inline: true },
          { name: "👑 Owner", value: `<@${guild.ownerId}>`, inline: true },
          { name: "👥 Tổng member", value: String(guild.memberCount), inline: true },
          { name: "🎖️ Số role", value: String(guild.roles.cache.size), inline: true },
          { name: "📁 Số kênh", value: String(guild.channels.cache.size), inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // /report (public xác nhận)
    if (interaction.commandName === "report") {
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");

      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("📣 Báo cáo mới")
        .addFields(
          { name: "👤 Người report", value: `<@${interaction.user.id}>`, inline: true },
          { name: "🎯 Người bị report", value: `<@${user.id}>`, inline: true },
          { name: "📍 Kênh", value: `${interaction.channel}`, inline: true },
          { name: "📝 Lý do", value: truncate(reason), inline: false }
        )
        .setTimestamp();

      const ok = await sendDMToOwnerBot(embed);

      await interaction.reply({
        content: ok ? "Đã gửi report tới quản trị." : "Không gửi được report tới quản trị."
      });
      return;
    }

    // /suggest (public xác nhận)
    if (interaction.commandName === "suggest") {
      const text = interaction.options.getString("text");

      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle("💡 Góp ý mới")
        .addFields(
          { name: "👤 Người gửi", value: `<@${interaction.user.id}>`, inline: true },
          { name: "📍 Kênh", value: `${interaction.channel}`, inline: true },
          { name: "📝 Nội dung", value: truncate(text), inline: false }
        )
        .setTimestamp();

      const ok = await sendDMToOwnerBot(embed);

      await interaction.reply({
        content: ok ? "Đã gửi góp ý tới quản trị." : "Không gửi được góp ý tới quản trị."
      });
      return;
    }
  } catch (err) {
    console.error("Lỗi slash command:", err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "Có lỗi khi thực hiện lệnh."
      }).catch(() => {});
    }
  }
});

client.login(TOKEN);