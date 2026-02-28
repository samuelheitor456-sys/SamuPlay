import {
  Client,
  GatewayIntentBits
} from "discord.js";

import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus
} from "@discordjs/voice";

import play from "play-dl";
import ffmpeg from "ffmpeg-static";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
});

const prefix = "!";
let player = createAudioPlayer();
let connection = null;

client.once("clientReady", () => {
  console.log("🎵 SamuPlay está online!");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // =========================
  // PLAY
  // =========================
  if (command === "play") {
    if (!args.length)
      return message.reply("❌ Você precisa informar o nome ou link da música.");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.reply("❌ Entre em um canal de voz primeiro.");

    try {
      // Conecta na call
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

      // Pesquisa música
      const search = await play.search(args.join(" "), { limit: 1 });
      if (!search.length)
        return message.reply("❌ Música não encontrada.");

      const url = search[0].url;

      // Stream
      const stream = await play.stream(url);

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type
      });

      player.play(resource);
      connection.subscribe(player);

      message.reply(`🎶 Tocando: **${search[0].title}**`);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

    } catch (error) {
      console.error("Erro ao tocar:", error);
      message.reply("❌ Erro ao tentar tocar a música.");
    }
  }

  // =========================
  // STOP
  // =========================
  if (command === "stop") {
    if (connection) {
      player.stop();
      connection.destroy();
      connection = null;
      message.reply("⏹ Música parada e saí da call.");
    } else {
      message.reply("❌ Não estou em nenhuma call.");
    }
  }
});

// Login com token
client.login(process.env.TOKEN);
