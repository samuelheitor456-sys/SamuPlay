require("libsodium-wrappers");

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  entersState,
  VoiceConnectionStatus
} = require("@discordjs/voice");

const ytdl = require("ytdl-core");
const ffmpeg = require("ffmpeg-static");
const { spawn } = require("child_process");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once("ready", () => {
  console.log(`✅ Online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {

  if (!message.content.startsWith("!play") || message.author.bot) return;

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.reply("Entre em um canal de voz.");

  const url = message.content.split(" ")[1];
  if (!url) return message.reply("Envie um link do YouTube.");

  if (!ytdl.validateURL(url)) {
    return message.reply("Envie um link válido do YouTube.");
  }

  try {

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
      selfDeaf: false
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 20000);

    const stream = ytdl(url, {
      filter: "audioonly",
      highWaterMark: 1 << 25
    });

    const ffmpegProcess = spawn(ffmpeg, [
      "-analyzeduration", "0",
      "-loglevel", "0",
      "-i", "pipe:0",
      "-f", "s16le",
      "-ar", "48000",
      "-ac", "2",
      "pipe:1"
    ], {
      stdio: ["pipe", "pipe", "ignore"]
    });

    stream.pipe(ffmpegProcess.stdin);

    const resource = createAudioResource(ffmpegProcess.stdout);

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
      }
    });

    connection.subscribe(player);
    player.play(resource);

    message.reply("🎵 Tocando!");

  } catch (err) {
    console.error("ERRO REAL:", err);
    message.reply("Erro ao tocar música.");
  }

});

client.login(process.env.TOKEN);
